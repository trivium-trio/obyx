const express  =require('express');
const cors=require('cors');
const dotenv=require('dotenv');
const app=express();




app.use(cors());

dotenv.config();
app.get('/',(req,res)=>{
    res.send('Hello World');
});
app.get('/user',(req,res)=>{
    res.send('these  are  my  users');
});
app.post('/api/v1/payments/checkout',(req,res)=>{
    res.send('Checkout route');
});
const port=process.env.PORT || 5000;
app.listen(port,()=>{
    console.log(`OBYX  is  cooking on port ${port}`);
});