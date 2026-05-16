import nodemailer from 'nodemailer';
import { CustomError, HttpStatusCodes } from '../utils/helpers/index.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.warn(
        'Variáveis de ambiente EMAIL_USER e EMAIL_APP_PASSWORD não configuradas. Serviço de e-mail não estará disponível.',
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
      console.log('Serviço de e-mail inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar serviço de e-mail:', error);
    }
  }

  async enviarEmail(to, subject, text, html = null) {
    if (!this.transporter) {
      throw new CustomError({
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
        errorType: 'emailServiceUnavailable',
        field: 'Email',
        details: [],
        customMessage: 'Serviço de e-mail não está configurado.',
      });
    }

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'Edu Connect'}" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('E-mail enviado com sucesso:', info.response);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      throw new CustomError({
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
        errorType: 'emailSendError',
        field: 'Email',
        details: [],
        customMessage: 'Erro ao enviar e-mail. Tente novamente mais tarde.',
      });
    }
  }

  async enviarEmailConvite(nome, email, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const activationUrl = `${frontendUrl}/ativar-conta?token=${token}`;

    const subject = 'Ative sua conta';

    const text = `
Olá, ${nome}!

Sua conta foi criada. Clique no link para definir sua senha:
${activationUrl}

Link válido por 5 minutos.

Equipe Edu Connect
        `.trim();

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #306FCC; font-size: 24px; margin-bottom: 20px; margin-top: 0;">Bem-vindo ao Edu Connect!</h1>
            <p style="margin: 0 0 15px 0; font-size: 18px;">Olá, <strong>${nome}</strong>!</p>
            <p style="margin: 0 0 20px 0; font-size: 18px;">Sua conta foi criada no sistema. Para começar, clique no botão abaixo e defina sua senha.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${activationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #306FCC; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Ativar minha conta</a>
            </div>
            <div style="margin-top: 25px; border-radius: 4px;">
                <p style="margin: 0; font-size: 18px;"><strong>Importante:</strong> Este link expira em 5 minutos por segurança.</p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <p style="margin: 0 0 8px 0; font-size: 16px;">Não solicitou este cadastro? Ignore este e-mail.</p>
                <p style="margin: 0; font-size: 16px; color: #999;">Equipe Edu Connect</p>
            </div>
        </div>
    </div>
</body>
</html>
        `.trim();

    return await this.enviarEmail(email, subject, text, html);
  }

  async enviarEmailVinculo(nome, email, role, schoolName) {
    const roleLabel = role === 'teacher' ? 'professor' : 'responsável';

    const subject = `Você foi vinculado à ${schoolName}`;

    const text = `
Olá, ${nome}!

Você foi vinculado como ${roleLabel} na escola ${schoolName} no sistema Edu Connect.

A partir de agora você já pode acessar o aplicativo com suas credenciais.

Equipe Edu Connect
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #306FCC; font-size: 24px; margin-bottom: 20px; margin-top: 0;">Você foi vinculado à escola!</h1>
            <p style="margin: 0 0 15px 0; font-size: 18px;">Olá, <strong>${nome}</strong>!</p>
            <p style="margin: 0 0 20px 0; font-size: 18px;">Você foi vinculado como <strong>${roleLabel}</strong> na escola <strong>${schoolName}</strong> no sistema Edu Connect.</p>
            <p style="margin: 0 0 20px 0; font-size: 18px;">A partir de agora você já pode acessar o aplicativo com suas credenciais.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="margin: 0; font-size: 16px; color: #999;">Equipe Edu Connect</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();

    return await this.enviarEmail(email, subject, text, html);
  }

  async enviarEmailRecuperacaoSenha(nome, email, codigo) {
    const subject = 'Recuperação de senha';

    const text = `
Olá, ${nome}!

Você solicitou a recuperação de senha da sua conta no Edu Connect.

Seu código de recuperação é: ${codigo}

Este código é válido por 1 hora.

Se você não solicitou esta recuperação, ignore este e-mail.

Equipe Edu Connect
        `.trim();

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #306FCC; font-size: 24px; margin-bottom: 20px; margin-top: 0;">Recuperação de Senha</h1>
            <p style="margin: 0 0 15px 0; font-size: 18px;">Olá, <strong>${nome}</strong>!</p>
            <p style="margin: 0 0 20px 0; font-size: 18px;">Você solicitou a recuperação de senha da sua conta. Use o código abaixo para redefinir sua senha.</p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; padding: 16px 40px; border-radius: 8px;">
                    <span style="font-size: 36px; font-weight: bold; color: #306FCC; letter-spacing: 8px;">${codigo}</span>
                </div>
            </div>
            <div style="margin-top: 25px; border-radius: 4px;">
                <p style="margin: 0; font-size: 18px;"><strong>Importante:</strong> Este código expira em 5 minutos por segurança.</p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <p style="margin: 0 0 8px 0; font-size: 16px;">Não solicitou esta recuperação? Ignore este e-mail.</p>
                <p style="margin: 0; font-size: 16px; color: #999;">Equipe Edu Connect</p>
            </div>
        </div>
    </div>
</body>
</html>
        `.trim();

    return await this.enviarEmail(email, subject, text, html);
  }

  async enviarEmailConviteEscola(email, schoolName, role) {
    const roleLabel = role === 'teacher' ? 'professor(a)' : 'responsável';
    const subject = `Você foi convidado(a) para a ${schoolName}`;

    const text = `
Olá!

A diretoria da escola ${schoolName} cadastrou seu e-mail no sistema Edu Connect como ${roleLabel}.

Para acessar o aplicativo, baixe o Edu Connect e crie sua conta com este e-mail ou entre com o Google: ${email}

Equipe Edu Connect
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #306FCC; font-size: 24px; margin-bottom: 20px; margin-top: 0;">Você foi convidado(a)!</h1>
            <p style="margin: 0 0 15px 0; font-size: 18px;">A diretoria da escola <strong>${schoolName}</strong> cadastrou seu e-mail no sistema Edu Connect como <strong>${roleLabel}</strong>.</p>
            <p style="margin: 0 0 20px 0; font-size: 18px;">Para acessar, baixe o aplicativo <strong>Edu Connect</strong> e entre com este e-mail:</p>
            <div style="background: #f0f4ff; border-radius: 6px; padding: 14px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-size: 20px; font-weight: bold; color: #306FCC;">${email}</p>
            </div>
            <p style="margin: 0 0 20px 0; font-size: 16px;">Você pode criar uma conta com este e-mail ou <strong>entrar diretamente com o Google</strong>, desde que use este mesmo endereço.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="margin: 0; font-size: 16px; color: #999;">Equipe Edu Connect</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();

    return await this.enviarEmail(email, subject, text, html);
  }
}

export default new EmailService();
