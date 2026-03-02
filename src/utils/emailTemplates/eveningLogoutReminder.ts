/**
 * Evening Logout Reminder Template
 * Sent at 8:30 PM to employees who haven't logged out
 */
export function getEveningLogoutReminderTemplate(): string {
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
            <h1>Time to Log Out</h1>
        </div>
        <div class="content">
            <p>Dear Team,</p>
            
            <p>
                As the working day comes to an end, please ensure that you properly log out from the system 
                before leaving.
            </p>
            
            <p class="section-title">Why It's Important:</p>
            <p>
                Timely logout helps maintain accurate working hour records and attendance tracking. 
                It also ensures proper tracking of your work progress and productivity metrics.
            </p>
            
            <p class="section-title">Action Required:</p>
            <p>
                Please log out from the system now to ensure your attendance record is complete and accurate.
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
