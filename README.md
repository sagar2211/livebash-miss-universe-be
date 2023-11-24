# Miss Universe Livebash
This application is used for booking online tickets for virtual events. User need to sign up via google, facebook or email.<br />
Then user have to sign in. After signing in, the user will see a list of events. User can choose an event and book an online ticket.<br />

# Requirements
For backend development : <br />
Node.js, node global packages, NPM, installed in your environment.
Configuration requirements : <br />
Sendgrid credentials,<br />
Mongodb Atlas account,<br />
S3 Bucket Path

# Node
Node installation on your system<br />
Install Node : v18.8.0
Install NPM : v8.0.0
Just go on [official Node.js website](https://nodejs.org/) and download the installer
You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).
If the installation was successful, you should be able to run the following command.<br />
node --version : You will get an node version.<br />
npm --version : You will get an npm version.<br />

# MongoDB
Use MongoDB Cluster : v6.0.11<br />

# Project Clone
You can clone the project using below command<br />
git clone https://bitbucket.org/codeastu/livebash-miss-universe-be/src/master<br />
After the project clone you need to run below command.<br />
npm install<br />

# Running the project on local machine
npm run [environment]<br />

# Health check
You can navigate to this url for health check : http://localhost:8080

# Swagger API Documentation
You can use the below command for generate swagger API documentation.<br />
[environment]-start-gendoc<br />

# Postman Collection
You have to import below link in your postman. All backend api's are over there.<br />
https://gold-satellite-736515.postman.co/workspace/New-Team-Workspace~6d995843-fcb0-4be1-8e8f-35d48d7c0e89/collection/29472144-fccb955d-b27d-435e-b918-88f2caed0071?action=share&creator=23636998&active-environment=23636998-6b08a661-e47d-4c7f-ad50-5c72aa32c189
<br />
After the import collection you have to add environment in postman collection.<br />
local BASEURL : http://localhost:8080<br />
qa BASEURL : http://miss-universe-backend-qa.us-east-1.elasticbeanstalk.com<br />

# API
You can use api in postman like below API<br />
GET : http://localhost:8080/mis-universe/v1/getAllEvents

# AWS S3 Bucket
We added all the email template images on aws s3 bucket in miss-universe folder.<br />
For S3 bucket you need to use your access key and use below link for the all image access.<br />
https://s3.console.aws.amazon.com/s3/buckets/miss-universe?region=us-east-1 <br/>

# Email templates
1. Order Confirmation : We send order confirmation email when user done with payment successful for order of virtual events.<br />
2. Event Remainder : We send event remainder email template before the 24 hour and 15 min ago of event to those user who are bought the ticket successfully.<br />
3. Resend OTP : This email is send to user who bought the ticket and try to get OTP.<br />
4. Reset Password : We send this email to user when user want to reset password.