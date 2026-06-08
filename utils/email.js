const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true для 465, false для 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM = `"CoolQuiz" <${process.env.SMTP_USER}>`;
const BASE_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// обёртка письма
function wrapHtml(title, bodyHtml) {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff;
                 border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #6c47d9; padding: 28px 32px; }
    .header h1 { margin: 0; color: #fff; font-size: 22px; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .btn { display: inline-block; margin: 24px 0 8px;
           background: #6c47d9; color: #fff !important; text-decoration: none;
           padding: 13px 28px; border-radius: 7px; font-size: 15px; font-weight: 600; }
    .footer { padding: 16px 32px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
    .note { font-size: 12px; color: #999; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🎯 CoolQuiz</h1></div>
    <div class="body">
      <h2 style="margin-top:0">${title}</h2>
      ${bodyHtml}
    </div>
    <div class="footer">Это письмо отправлено автоматически. Не отвечайте на него.</div>
  </div>
</body>
</html>`;
}

// подтверждение email
async function sendVerificationEmail(to, token) {
    const link = `${BASE_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: FROM,
        to,
        subject: 'Подтвердите ваш email — CoolQuiz',
        html: wrapHtml('Добро пожаловать!', `
            <p>Спасибо за регистрацию. Нажмите кнопку ниже, чтобы подтвердить ваш email:</p>
            <a class="btn" style="color: #ffffff !important; text-decoration: none;" href="${link}">Подтвердить email</a>
            <p class="note">Ссылка действует <strong>24 часа</strong>.<br>
            Если вы не регистрировались — просто проигнорируйте это письмо.</p>
            <p class="note">Не работает кнопка? Скопируйте ссылку:<br>
            <a href="${link}">${link}</a></p>
        `),
    });
}

// сброс пароля
async function sendPasswordResetEmail(to, token) {
    const link = `${BASE_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: FROM,
        to,
        subject: 'Сброс пароля — CoolQuiz',
        html: wrapHtml('Сброс пароля', `
            <p>Мы получили запрос на сброс пароля для вашего аккаунта.</p>
            <a class="btn" style="color: #ffffff !important; text-decoration: none;" href="${link}">Задать новый пароль</a>
            <p class="note">Ссылка действует <strong>1 час</strong>.<br>
            Если вы не запрашивали сброс — ничего делать не нужно, ваш пароль в безопасности.</p>
            <p class="note">Не работает кнопка? Скопируйте ссылку:<br>
            <a href="${link}">${link}</a></p>
        `),
    });
}

// уведомление о смене пароля
async function sendPasswordChangedEmail(to) {
    await transporter.sendMail({
        from: FROM,
        to,
        subject: 'Пароль изменён — CoolQuiz',
        html: wrapHtml('Пароль успешно изменён', `
            <p>Пароль вашего аккаунта был успешно изменён.</p>
            <p>Если это были не вы — немедленно свяжитесь с нами или воспользуйтесь формой сброса пароля.</p>
            <a class="btn" style="color: #ffffff !important; text-decoration: none;" href="${BASE_URL}/forgot-password">Сбросить пароль</a>
        `),
    });
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendPasswordChangedEmail,
};