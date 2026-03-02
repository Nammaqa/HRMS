/**
 * Good Morning Message + Attendance Reminder Template
 * Sent at 9:30 AM to employees who haven't logged in
 */
export function getGoodMorningReminderTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #000;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            border-bottom: 1px solid #000;
            padding: 20px 0;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: bold;
        }
        .content {
            padding: 0;
            line-height: 1.8;
        }
        p {
            margin: 15px 0;
        }
        .section-title {
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .footer {
            border-top: 1px solid #000;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Good Morning!</h1>
        </div>
        <div class="content">
            <p>Dear Team,</p>
            
            <p>
                We hope you have a productive and successful day ahead.
            </p>
            
            <p class="section-title">Attendance Reminder:</p>
            <p>
                This is a gentle reminder to please log in to the system and mark your attendance on time. 
                Kindly ensure your login is completed as per company working hours.
            </p>
            
            <p>
                We appreciate your cooperation in maintaining accurate attendance records.
            </p>
            
            <p>
                Wishing you a great day at work.
            </p>
        </div>
        <div class="footer">
            <p>Best Regards,</p>
            <p>HR Team</p>
        </div>
    </div>
</body>
</html>
  `;
}
