const express = require('express');
const passport = require('passport');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const db = require('./db'); // 1. DB를 맨 위에서 한 번만 불러옵니다.
require('dotenv').config();
require('./passport');

const app = express();

// 세션 및 패스포트 설정
app.use(session({ secret: 'galrae-secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// [라우트 1] 카카오 로그인 관련
app.get('/auth/kakao', passport.authenticate('kakao'));

app.get('/auth/kakao/callback', 
    passport.authenticate('kakao', { failureRedirect: '/' }),
    (req, res) => {
        res.send(`반갑습니다, ${req.user.nickname}님! 갈래말래 DB 등록 완료!`);
    }
);

// [라우트 2] 게시글 목록 조회 API
app.get('/meetings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Meetings'); // db.query가 이제 잘 작동할 거예요!
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("❌ DB 에러 발생:", error);
        res.status(500).json({ success: false, message: 'DB 조회 실패' });
    }
});

app.get('/auth/kakao/callback', 
    passport.authenticate('kakao', { failureRedirect: '/' }),
    (req, res) => {
        // 2. 로그인 성공한 유저 정보를 바탕으로 JWT 발급
        const token = jwt.sign(
            { id: req.user.id, nickname: req.user.nickname }, // 담고 싶은 내용
            'galrae-secret-key', // 나만 아는 비밀키 (나중에 .env로 옮겨야 함)
            { expiresIn: '1h' }   // 1시간 동안만 유효
        );

        // 3. 브라우저에 토큰을 보여주거나 쿠키에 담아서 보냄
        res.json({
            success: true,
            message: `${req.user.nickname}님 로그인 성공!`,
            token: token // 이제 이 토큰이 유저의 신분증이 됩니다!
        });
    }
);

// [서버 시작] 딱 한 번만 실행합니다!
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ 갈래말래 서버 시작! 포트: ${PORT}`);
    console.log(`👉 http://localhost:${PORT}/meetings 접속해서 확인해 보세요.`);
});