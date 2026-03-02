/**
 * Leave / Work From Home Approval Email Template
 * Sent when a leave or WFH request is approved or rejected
 */
export interface LeaveApprovalData {
  employeeName: string;
  leaveType: 'LEAVE' | 'WFH' | 'CASUAL LEAVE' | 'SICK LEAVE' | 'PERSONAL LEAVE';
  dates: string; // e.g., "Jan 20-22, 2026" or "Jan 20, 2026"
  status: 'APPROVED' | 'REJECTED';
  reason?: string; // For rejection reasons if applicable
}

export function getLeaveApprovalTemplate(data: LeaveApprovalData): string {
  const isApproved = data.status === 'APPROVED';
  const statusText = isApproved ? 'Approved' : 'Rejected';

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
        .details {
            margin: 20px 0;
        }
        .detail-row {
            margin: 10px 0;
            padding: 5px 0;
        }
        .detail-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
        }
        .detail-value {
            display: inline-block;
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
            <h1>Request ${statusText}</h1>
        </div>
        <div class="content">
            <p>Dear ${data.employeeName},</p>
            
            <p>
                This is to inform you that your request for ${data.leaveType} from <strong>${data.dates}</strong> 
                has been <strong>${statusText.toLowerCase()}</strong>.
            </p>
            
            <p class="section-title">Request Details:</p>
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">Request Type:</span>
                    <span class="detail-value">${data.leaveType}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date Range:</span>
                    <span class="detail-value">${data.dates}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${statusText}</span>
                </div>
                ${data.reason ? `
                <div class="detail-row">
                    <span class="detail-label">Remarks:</span>
                    <span class="detail-value">${data.reason}</span>
                </div>
                ` : ''}
            </div>
            
            ${isApproved ? `
            <p class="section-title">Next Steps:</p>
            <p>
                Please ensure proper handover of tasks (if applicable) and resume work as per your schedule.
            </p>
            ` : `
            <p class="section-title">Note:</p>
            <p>
                Your request has not been approved. For more details or to discuss, kindly contact HR.
            </p>
            `}
            
            <p>
                If you have any questions or need further assistance, feel free to contact the HR team.
            </p>
            
            <p>
                We appreciate your cooperation.
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
