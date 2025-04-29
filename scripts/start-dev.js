const { exec } = require('child_process');
const { platform } = require('os');

// Function to kill process on port 3000
function killProcessOnPort(port) {
  return new Promise((resolve, reject) => {
    const command = platform() === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`No process found on port ${port}`);
        resolve();
        return;
      }

      if (platform() === 'win32') {
        // Windows: Extract PID from netstat output
        const lines = stdout.split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4) {
            const pid = parts[parts.length - 1];
            if (pid) {
              exec(`taskkill /F /PID ${pid}`, (err) => {
                if (err) {
                  console.error(`Failed to kill process ${pid}:`, err);
                } else {
                  console.log(`Killed process ${pid} on port ${port}`);
                }
              });
            }
          }
        }
      } else {
        // Unix: Extract PID from lsof output
        const lines = stdout.split('\n');
        if (lines.length > 1) {
          const pid = lines[1].split(/\s+/)[1];
          if (pid) {
            exec(`kill -9 ${pid}`, (err) => {
              if (err) {
                console.error(`Failed to kill process ${pid}:`, err);
              } else {
                console.log(`Killed process ${pid} on port ${port}`);
              }
            });
          }
        }
      }
      resolve();
    });
  });
}

// Main function
async function startDev() {
  try {
    // Kill any process on port 3000
    await killProcessOnPort(3000);
    
    // Start Next.js dev server
    const nextDev = exec('next dev', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting Next.js: ${error}`);
        return;
      }
      if (stderr) {
        console.error(`Next.js stderr: ${stderr}`);
        return;
      }
      console.log(`Next.js stdout: ${stdout}`);
    });

    nextDev.stdout.pipe(process.stdout);
    nextDev.stderr.pipe(process.stderr);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

startDev(); 