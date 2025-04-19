document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const intervalInput = document.getElementById('interval');
    const formatSelect = document.getElementById('format');
    const folderPathInput = document.getElementById('folderPath');
    const browseBtn = document.getElementById('browseBtn');
    const statusDiv = document.getElementById('status');
    const notificationCheckbox = document.getElementById('notifications');
  
    // Load saved settings
    window.electronAPI.getSettings().then(settings => {
      intervalInput.value = settings.interval;
      formatSelect.value = settings.format;
      folderPathInput.value = settings.folderPath;
    });
  
    // Browse for folder
    browseBtn.addEventListener('click', async () => {
      const { dialog } = require('electron').remote;
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      });
      if (!result.canceled && result.filePaths.length > 0) {
        folderPathInput.value = result.filePaths[0];
      }
    });
  
    // Start capture
    startBtn.addEventListener('click', async () => {
      const interval = parseInt(intervalInput.value);
      const format = formatSelect.value;
      const folderPath = folderPathInput.value;
  
      if (isNaN(interval)) {
        statusDiv.textContent = 'Please enter a valid interval';
        statusDiv.style.color = 'red';
        return;
      }
  
      if (interval < 1) {
        statusDiv.textContent = 'Interval must be at least 1 second';
        statusDiv.style.color = 'red';
        return;
      }
  
      statusDiv.textContent = `Capturing screenshots every ${interval} seconds...`;
      statusDiv.style.color = 'green';
  
      await window.electronAPI.startCapture({
        interval,
        format,
        folderPath
      });
    });
  
    // Stop capture
    stopBtn.addEventListener('click', async () => {
      await window.electronAPI.stopCapture();
      statusDiv.textContent = 'Capture stopped';
      statusDiv.style.color = 'black';
    });
  
    // Listen for capture events
    window.electronAPI.onCaptureSuccess((event, path) => {
      console.log('Capture success:', path);
      if (notificationCheckbox.checked) {
        new Notification('Screenshot Captured', {
          body: `Saved to ${path.split('/').pop()}`
        });
      }
    });
  
    window.electronAPI.onCaptureError((event, error) => {
      console.error('Capture error:', error);
      statusDiv.textContent = `Error: ${error}`;
      statusDiv.style.color = 'red';
    });
  });