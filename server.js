const express = require('express')
const app = express()

app.use(express.static(__dirname+'/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const { MongoClient, ObjectId } = require('mongodb')

let db;
const url = "mongodb+srv://sdh4202:dhseo6367@atlascluster.qkezatx.mongodb.net/?retryWrites=true&w=majority";
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
  app.listen(8080, () => {
      console.log('http://localhost:8080 에서 서버 실행중')
  })
}).catch((err)=>{
  console.log(err)
})


app.get('/', (req, res) => {
  res.sendFile(__dirname+'/index.html')
}) 

app.get('/news', (req, res) => {
  // res.send('오늘 비온다.')
}) 

app.get('/list', async(req, res) => {
  let result = await db.collection('post').find().toArray()
  console.log(result)
  // res.send(result[0].title)
  res.render('list.ejs', { posts : result })
})

app.get('/time', (req, res) => {
  Date = new Date();
  res.render('time.ejs', { time : Date })
}) 

app.get('/write', (req, res) => {
  res.render('write.ejs')
})

app.post('/newpost',async (req,res) =>{
  console.log(req.body)
  try {
    if(req.body.title == ''){
      res.send('글을 입력하세요')
    }else{
      await db.collection('post').insertOne({title : req.body.title, content : req.body.content})
      res.redirect('/list')
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('error')
  }
})

app.get('/detail/:id', async (req, res)=>{
  
  try{
    let idPost = await db.collection('post').findOne({_id : new ObjectId(req.params.id)})
    res.render('detail.ejs', { post : idPost })
    console.log(idPost)
  }catch(e){
    console.log(e)
    res.status(400).send('wrong access')
  }
})

app.get('/edit/:id', async (req, res)=>{
try{
  let idPost = await db.collection('post').findOne({_id : new ObjectId(req.params.id)})
  res.render('edit.ejs', { post : idPost })
  // console.log(req.params)
}catch(e){
  console.log(e)
}

})

app.post('/editpost/:id', async (req, res) => {
  console.log(req.params.id);
  try {
    let result = await db.collection('post').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { title: req.body.title, content: req.body.content } }
      );
    res.redirect('/list')
  } catch (e) {
    console.log(e);
  }
});

app.delete('/delete', async(req, res)=> {

    let result = await db.collection('post').deleteOne({ _id : new ObjectId(req.query.docid) })
    res.send('삭제완료')

})