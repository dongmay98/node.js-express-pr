const express = require('express')
const app = express()

app.use(express.static(__dirname+'/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const bcrypt = require('bcrypt')
const { MongoClient, ObjectId } = require('mongodb')
const MongoStore = require('connect-mongo')
require('dotenv').config()

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

// passport 세팅
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')

app.use(passport.initialize())
app.use(session({
  secret: '0000',
  resave : false,
  saveUninitialized : false,
  store : MongoStore.create({
    mongoUrl : "mongodb+srv://sdh4202:dhseo6367@atlascluster.qkezatx.mongodb.net/?retryWrites=true&w=majority",
    dbName : 'forum'
  })
}))

app.use(passport.session()) 

//passport 아이디/비번 검증
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('user').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: '아이디 DB에 없음' })
  }
  if (result.password == 입력한비번) {
    return cb(null, result)
  } else {
    return cb(null, false, { message: '비번불일치' });
  }
}))

passport.serializeUser((user, done)=>{
  process.nextTick(()=>{
    done(null, { id: user._id, username: user.username })
  })
})
passport.deserializeUser(async(user, done) => {
  let result = await db.collection('user').findOne({_id : new ObjectId(user.id) })
  delete result.password
  process.nextTick(() => {
    return done(null, result)
  })
})

// API
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

app.get('/join', async(req, res)=> {
  res.render('join.ejs');
})
app.post('/join', async (req, res) => {

  let hashpwd = await bcrypt.hash(req.body.password, 10)
  console.log(hashpwd)

  let result = await db.collection('user').insertOne({
    username: req.body.username,
    password: req.body.password
  });
  res.redirect('/login');
});

app.get('/login', async(req, res)=>{
  res.render('login.ejs')
})

app.post('/login', async (req, res, next) => {

  passport.authenticate('local', (error, user, info) => {
      if (error) return res.status(500).json(error)
      if (!user) return res.status(401).json(info.message)
      req.logIn(user, (err) => {
        if (err) return next(err)
        res.redirect('/')
        console.log(req.user)
      })
  })(req, res, next)

}) 