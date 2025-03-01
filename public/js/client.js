
document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const index = btn.dataset.index;
        const pollId = window.location.pathname.split('/')[2];
        
        const response = await fetch(`/poll/${pollId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ optionIndex: index })
        });
        
        if (response.ok) {
            socket.emit('vote', pollId);
            const data = await response.json();
            document.querySelectorAll('.votes').forEach((span, i) => {
                span.textContent = data.options[i].votes;
            });
        } else {
            alert('Voting period has ended!');
        }
    });
});

socket.on('updatePoll', async (pollId) => {
    if (window.location.pathname === `/poll/${pollId}`) {
        const response = await fetch(`/poll/${pollId}`);
        const poll = await response.json();
        if (document.querySelector('.votes')) { // Only update if creator
            document.querySelectorAll('.votes').forEach((span, i) => {
                span.textContent = poll.options[i].votes;
            });
        }
    }
});
