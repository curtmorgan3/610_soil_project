const aws = require("aws-sdk");
aws.config.update({region: `us-west-2`});
const nodemailer = require("nodemailer");
const ses = new aws.SES();
const sns = new aws.SNS();
const db = new aws.DynamoDB

//
let oneClick = true;
let twoClick = false;
let longClick = false; 
//

exports.handler = (event, context, callback) => {


    getData();
    
    function sendPayload(data) {
        if (oneClick) {
            const payload = data.map(item => {
                return {
                    'Time': item.M.timestamp['N'],
                    'Temperature': item.M.temperature['S'],
                    'Moisture': item.M.moisture['S']
                }
            });
            sendText(payload[0]);
            
        }else if (twoClick) {
            const payload = data.map(item => {
                return {
                    'Time': item.M.timestamp['N'],
                    'Temperature': item.M.temperature['S'],
                    'Moisture': item.M.moisture['S']
                };
            });
            sendEmail(payload.slice(0, 1), 's');
            
        }else if (longClick) {
            const payload = data.map(item => {
                return {
                    'Time': item.M.timestamp['N'],
                    'Temperature': item.M.temperature['S'],
                    'Moisture': item.M.moisture['S']
                };
            });
            sendEmail(payload, 'l');
            
        }
    }
    
    //Helpers
    function sendEmail(payload, size) {
        let mailOptions = {
            from: "curtmorgan3@gmail.com",
            subject: "Soil Update",
            to: "curtmorgan3@gmail.com"           
        };
        
        if (size === 's') {
            mailOptions.html = `
            
            <h3>Most Recent Data</h3>
            <p>Time: ${payload[0].Time}</p>
            <p>Temperature: ${payload[0].Temperature}</p>
            <p>Moisture: ${payload[0].Moisture}</p>
            `;
        }else {
            let htmlString = '<h3>Most Recent Data</h3>';
            payload.forEach(item => {
                htmlString += `
                <p>Time: ${item.Time}</p>
                <p>Temperature: ${item.Temperature}</p>
                <p>Moisture: ${item.Moisture}</p>
                `;
            });
            mailOptions.html = htmlString;
        }


        const transporter = nodemailer.createTransport({
            SES: ses
        });

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log("Error sending email");
                callback(err);
            } else {
                console.log("Email sent successfully");
                callback();
            }
        });

    }
    
    function sendText(payload) {
        var params = {
            Message: `
                Soil Update: Temp: ${payload.Temperature}
                Moisture: ${payload.Moisture}
            `,
            MessageStructure: 'string',
            PhoneNumber: '+19319933406'
        };

        sns.publish(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
        });
    }
    
    function getData() {
    
        const scanParams = {
            TableName: 'SoilDB',
        };
    
    
        let results = [];
        db.scan(scanParams, (err, data) => {
            if (err) {
                console.log(err); 
            } 
            else {
                data.Items.forEach(item => {
                    results.push(item.Payload);
                });
                
                sendPayload(results);
            }
        });
        

    }
    
    callback(null, 'Hello from Lambda');
};
