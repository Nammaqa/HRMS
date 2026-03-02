/**
 * Auto Logout Warning – EL Deduction Notice Template
 * Sent when an employee is auto-logged out due to failure to manually logout
 */
export function getAutoLogoutWarningTemplate(): string {
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
        ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        li {
            margin: 8px 0;
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
            <h1>Auto Logout Notice</h1>
        </div>
        <div class="content">
            <p>Dear Employee,</p>
            
            <p>
                This is to inform you that you were automatically logged out from the system 
                due to failure to manually log out within the specified time.
            </p>
            
            <p class="section-title">What Happened:</p>
            <p>
                You did not manually log out from the system before the end of your working hours. 
                The system automatically logged you out at 11:59 PM to ensure accurate attendance tracking.
            </p>
            
            <p class="section-title">Important Policy Notice:</p>
            <p>
                Repeated occurrences of auto logout may result in a deduction of 0.5 EL (Earned Leave) 
                from your leave balance on your next applicable leave period.
            </p>
            
            <p class="section-title">Best Practices for Logout:</p>
            <ul>
                <li>Always manually log out before leaving your workspace</li>
                <li>Ensure you log out within your scheduled working hours</li>
                <li>Double-check that the system confirms your logout</li>
                <li>If you're working from home, ensure proper logout procedures</li>
                <li>In case of technical issues, inform HR immediately</li>
            </ul>
            
            <p class="section-title">Action Required:</p>
            <p>
                We request you to establish a routine of timely logout to avoid further deductions. 
                If you frequently face issues with the system, please contact HR for assistance.
            </p>
            
            <p>
                We value your cooperation and commitment to maintaining accurate attendance records. 
                Thank you for your understanding.
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
