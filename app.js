const statusText = document.getElementById('status');

for (const button of document.querySelectorAll('.menu-buttons button')) {
  button.addEventListener('click', () => {
    statusText.textContent = `${button.textContent} selected (prototype action).`;
  });
}
