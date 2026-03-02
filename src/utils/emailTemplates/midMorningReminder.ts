/**
 * Login & Attendance Reminder Template (Mid-Morning)
 * Sent to employees with no attendance record for the day
 */
export function getMidMorningReminderTemplate(): string {
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
            <h1>Action Required</h1>
        </div>
        <div class="content">
            <p>Dear Team,</p>
            
            <p>
                This is a friendly reminder to those who have not yet logged in or marked their attendance today.
            </p>
            
            <p class="section-title">Important:</p>
            <p>
                Kindly log in to the system and complete your attendance at the earliest to avoid any discrepancies 
                in attendance records.
            </p>
            
            <p>
                Your timely login ensures accurate tracking and helps us maintain proper records.
            </p>
            
            <p>
                Thank you for your cooperation.
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
