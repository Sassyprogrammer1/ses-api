'use strict';

const AWS = require('aws-sdk');
const axios = require('axios');
const FormData = require('form-data');
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.AWSREGION,
});

const simpleParser = require('mailparser').simpleParser;

const API_URL = 'https://guvenlipanel.com/api/bank-transfers/messages?token=d792fe2e9162ef617e24f7e557937f8ec93e03d77e4f5baf494d641629fdaf24';

module.exports.postprocess = async (event) => {
  // console.log('Received event:', JSON.stringify(event, null, 2));
  const record = event.Records[0];
  // Retrieve the email from your bucket
  const request = {
    Bucket: record.s3.bucket.name,
    Key: record.s3.object.key,
  };

  try {
    const data = await s3.getObject(request).promise();
    // console.log('Raw email:' + data.Body);
    const email = await simpleParser(data.Body);
    console.log('date:', email.date);
    console.log('subject:', email.subject);
    console.log('body:', email.text);
    console.log('from:', email.from.text);
    console.log('attachments:', email.attachments);

    let subject = email.subject;
    let body = email.text;
    let content;

    if (subject.includes('Hesabınızdan nakit çıkışı olmuştur')) {
      content = body;
    } else if (subject.includes('Hesabınıza nakit girişi olmuştur')) {
      content = body;
    } else {
      console.log('Irrelevant email subject');
      return;
    }
    const form = new FormData();
    form.append('message', content);

    const response = await axios.post(API_URL, form, {
      headers: {
          ...form.getHeaders(),
          'accept': '/',
          'Content-Type': 'multipart/form-data',
          'X-CSRF-TOKEN': 'hhWH8W4ySVwV53WheOwO5ZlhWQRdlHQo3hJUNLDn'
      }
    });
    console.log('Successfully sent to API', response.data);
  } catch (Error) {
    if (error.response) {
      console.error('Error response from API:', error.response.data);
    } else if (error.request) {
      console.error('No response received from API:', error.request);
    } else {
      console.error('Error creating request:', error.message);
    }
  }
};
