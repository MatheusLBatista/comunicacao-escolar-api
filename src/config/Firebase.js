import 'dotenv/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

function parseServiceAccount() {
	// Opção 1: credencial completa em JSON, útil para ambientes de deploy.
	const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

	if (serviceAccountJson) {
		return JSON.parse(serviceAccountJson);
	}

	// Opção 2: credenciais separadas por variável de ambiente.
	const projectId = process.env.FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

	if (projectId && clientEmail && privateKey) {
		return {
			projectId,
			clientEmail,
			privateKey,
		};
	}

	return null;
}

function createFirebaseApp() {
	// Evita inicializar o Firebase mais de uma vez quando o módulo é importado.
	if (getApps().length > 0) {
		return getApps()[0];
	}

	const serviceAccount = parseServiceAccount();

	// Se houver credenciais explícitas, sobe o Admin SDK autenticado.
	if (serviceAccount) {
		return initializeApp({
			credential: cert(serviceAccount),
			projectId: serviceAccount.projectId,
		});
	}

	// Fallback: usa a configuração padrão do ambiente.
	return initializeApp();
}

// Instância principal do Firebase Admin para uso no restante da aplicação.
const firebaseApp = createFirebaseApp();
// Serviço de envio de mensagens push para tokens, tópicos e grupos.
const firebaseMessaging = getMessaging(firebaseApp);

export { firebaseApp, firebaseMessaging };
export default firebaseApp;