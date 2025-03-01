document.addEventListener('DOMContentLoaded', () => {
  console.log('Client script loaded');
  const socket = io(); // Connect to Socket.io

  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = btn.dataset.index;
      const pollId = window.location.pathname.split('/')[2];
      
      try {
        const response = await fetch(`/poll/${pollId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionIndex: parseInt(index) })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }

        const data = await response.json();
        document.querySelectorAll('.votes').forEach((span, i) => {
          span.textContent = `(${data.options[i].votes})`;
        });
        btn.disabled = true;
        socket.emit('vote', pollId); // Notify server of vote
      } catch (error) {
        alert(error.message || 'An error occurred while voting');
      }
    });
  });

  socket.on('updatePoll', (data) => {
    if (data.pollId === window.location.pathname.split('/')[2]) {
      document.querySelectorAll('.votes').forEach((span, i) => {
        span.textContent = `(${data.options[i].votes})`;
      });
    }
  });
});
