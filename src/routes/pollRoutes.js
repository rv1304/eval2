const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const QRCode = require('qrcode');
const Sentiment = require('../utils/sentiment');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  const polls = await Poll.find().sort({ createdAt: -1 });
  res.render('index', { polls });
});

router.get('/create', (req, res) => {
  let creatorId = req.cookies.creatorId;
  if (!creatorId) {
    creatorId = uuidv4();
    res.cookie('creatorId', creatorId, { maxAge: 365 * 24 * 60 * 60 * 1000 });
  }
  res.render('create-poll', { creatorId });
});

router.post('/create', async (req, res) => {
  const { title, options, isAnonymous, duration } = req.body;
  const creatorId = req.cookies.creatorId || uuidv4();
  const endTime = new Date(Date.now() + parseInt(duration) * 60 * 1000);
  
  const poll = new Poll({
    title,
    options: options.map(text => ({ text })),
    isAnonymous: !!isAnonymous,
    endTime,
    sentiment: Sentiment.analyze(title),
    creatorId
  });

  await poll.save();
  res.redirect(`/poll/${poll._id}`);
});

router.get('/poll/:id', async (req, res) => {
  const poll = await Poll.findById(req.params.id);
  if (!poll) {
    return res.status(404).send('Poll not found');
  }
  const qrCode = await QRCode.toDataURL(`${req.protocol}://${req.get('host')}/poll/${poll._id}`);
  const isCreator = req.cookies.creatorId === poll.creatorId;
  const shareUrl = `${req.protocol}://${req.get('host')}/poll/${poll._id}`; // Compute share URL
  res.render('poll', { poll, qrCode, isCreator, shareUrl }); // Pass variables to template
});

router.post('/poll/:id/vote', async (req, res) => {
  const { optionIndex } = req.body;
  const poll = await Poll.findById(req.params.id);
  
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  
  if (new Date() > poll.endTime) {
    return res.status(400).json({ error: 'Poll has ended' });
  }
  
  poll.options[optionIndex].votes += 1;
  await poll.save();
  res.json({ options: poll.options });
});

router.get('/poll/:id/export/:format', async (req, res) => {
  const poll = await Poll.findById(req.params.id);
  if (!poll) {
    return res.status(404).send('Poll not found');
  }
  if (req.cookies.creatorId !== poll.creatorId) {
    return res.status(403).send('Only poll creator can export results');
  }

  const format = req.params.format;
  if (format === 'csv') {
    const csvWriter = createCsvWriter({
      path: `poll_${poll._id}.csv`,
      header: [
        { id: 'option', title: 'Option' },
        { id: 'votes', title: 'Votes' }
      ]
    });
    
    const records = poll.options.map(opt => ({
      option: opt.text,
      votes: opt.votes
    }));
    
    await csvWriter.writeRecords(records);
    res.download(`poll_${poll._id}.csv`);
  } else if (format === 'pdf') {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(`poll_${poll._id}.pdf`));
    doc.fontSize(20).text(poll.title, { align: 'center' });
    poll.options.forEach(opt => {
      doc.fontSize(14).text(`${opt.text} (${opt.votes})`);
    });
    doc.end();
    res.download(`poll_${poll._id}.pdf`);
  }
});

module.exports = router;