import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

function messageTextByType(type, turn) {
  if (type === 'daily_log_reply') {
    const dailyLogReplies = [
      'Obrigado pelo retorno do comunicado diário.',
      'Perfeito, vamos acompanhar essa evolução juntos.',
      'Pode deixar, reforçarei esse ponto na próxima aula.',
    ];

    return dailyLogReplies[turn % dailyLogReplies.length];
  }

  const privateTexts = [
    'Olá! Como foi o dia do aluno?',
    'Foi ótimo, ele participou bastante da atividade.',
    'Excelente, muito obrigado pelo feedback!',
  ];

  return privateTexts[turn % privateTexts.length];
}

export default async function messageSeed() {
  await Message.deleteMany({});

  const conversations = await Conversation.find({ active: true }).sort({
    created_at: 1,
  });

  if (!conversations.length) {
    console.log(
      'Seed de messages ignorada: nenhuma conversation ativa encontrada.',
    );
    return { insertedCount: 0 };
  }

  const messages = [];

  conversations.forEach((conversation) => {
    const participants = conversation.participants || [];

    if (participants.length < 2) return;

    const sentAtBase = conversation.last_message_at || new Date();

    for (let turn = 0; turn < 3; turn++) {
      const sender_id = participants[turn % participants.length];
      const receiver_id = participants[(turn + 1) % participants.length];
      const sent_at = new Date(
        sentAtBase.getTime() - (2 - turn) * 5 * 60 * 1000,
      );

      const read_by = [{ user_id: sender_id, at: sent_at }];
      if (turn < 2) {
        read_by.push({
          user_id: receiver_id,
          at: new Date(sent_at.getTime() + 2 * 60 * 1000),
        });
      }

      messages.push({
        conversation_id: conversation._id,
        sender_id,
        text: messageTextByType(conversation.type, turn),
        read_by,
        sent_at,
        active: true,
      });
    }

    conversation.last_message_at = messages[messages.length - 1].sent_at;
    conversation.last_message_text = messages[messages.length - 1].text;
  });

  const [result] = await Promise.all([
    Message.collection.insertMany(messages),
    Promise.all(conversations.map((conversation) => conversation.save())),
  ]);

  console.log(`Seeded ${result.insertedCount} messages.`);

  return {
    insertedCount: result.insertedCount,
    conversationCount: conversations.length,
  };
}
