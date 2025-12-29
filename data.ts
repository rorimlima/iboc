import { Member, Transaction, ChurchEvent, Sermon, SiteContent, Quote } from './types';

export const MOCK_MEMBERS: Member[] = [
  { id: '1', fullName: 'Carlos Silva', email: 'carlos@email.com', phone: '(85) 99999-9999', birthDate: '1980-05-15', status: 'Ativo', role: 'Diácono', address: 'Rua A, 123' },
  { id: '2', fullName: 'Ana Pereira', email: 'ana@email.com', phone: '(85) 98888-8888', birthDate: '1992-10-20', status: 'Ativo', role: 'Membro', address: 'Rua B, 456' },
  { id: '3', fullName: 'Marcos Oliveira', email: 'marcos@email.com', phone: '(85) 97777-7777', birthDate: '1975-03-10', status: 'Ausente', role: 'Membro', address: 'Rua C, 789' },
  { id: '4', fullName: 'Pr. João Santos', email: 'joao@iboc.com', phone: '(85) 96666-6666', birthDate: '1965-08-05', status: 'Ativo', role: 'Pastor', address: 'Rua D, 101' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { 
    id: '1', 
    type: 'Entrada', 
    category: 'Dízimo', 
    amount: 1500.00, 
    date: '2023-10-01', 
    description: 'Dízimo Carlos Silva', 
    contributorName: 'Carlos Silva',
    paymentMethod: 'Pix',
    bankAccount: 'Banco do Brasil'
  },
  { 
    id: '2', 
    type: 'Entrada', 
    category: 'Oferta', 
    amount: 350.50, 
    date: '2023-10-02', 
    description: 'Oferta Culto Domingo',
    paymentMethod: 'Dinheiro',
    bankAccount: 'Tesouraria (Espécie)'
  },
  { 
    id: '3', 
    type: 'Saída', 
    category: 'Manutenção', 
    amount: 200.00, 
    date: '2023-10-05', 
    description: 'Reparo Ar Condicionado',
    paymentMethod: 'Transferência',
    bankAccount: 'Banco do Brasil'
  },
  { 
    id: '4', 
    type: 'Entrada', 
    category: 'Missões', 
    amount: 800.00, 
    date: '2023-10-08', 
    description: 'Campanha Missionária',
    paymentMethod: 'Pix',
    bankAccount: 'Caixa Econômica'
  },
  { 
    id: '5', 
    type: 'Saída', 
    category: 'Energia', 
    amount: 450.00, 
    date: '2023-10-10', 
    description: 'Conta de Luz Enel',
    paymentMethod: 'Boleto',
    bankAccount: 'Banco do Brasil'
  },
];

export const MOCK_EVENTS: ChurchEvent[] = [
  { id: '1', title: 'Culto de Celebração', start: '2023-10-29T18:00:00', end: '2023-10-29T20:00:00', type: 'Culto', location: 'Templo Principal' },
  { id: '2', title: 'Reunião de Liderança', start: '2023-10-31T19:30:00', end: '2023-10-31T21:00:00', type: 'Reunião', location: 'Sala 1' },
  { id: '3', title: 'EBD', start: '2023-10-29T09:00:00', end: '2023-10-29T11:00:00', type: 'EBD', location: 'Salas de Aula' },
];

export const MOCK_SERMONS: Sermon[] = [
  { id: '1', title: 'A Fé que Move Montanhas', preacher: 'Pr. João Santos', date: '2023-10-22', series: 'Fé Inabalável', thumbnail: 'https://picsum.photos/400/225?random=1' },
  { id: '2', title: 'O Poder da Oração', preacher: 'Pr. João Santos', date: '2023-10-15', series: 'Fé Inabalável', thumbnail: 'https://picsum.photos/400/225?random=2' },
  { id: '3', title: 'Amando ao Próximo', preacher: 'Ev. Carlos Silva', date: '2023-10-08', thumbnail: 'https://picsum.photos/400/225?random=3' },
];

export const SOCIAL_ACTION_VERSES = [
  { text: "Filhinhos, não amemos de palavra, nem de língua, mas por obra e em verdade.", ref: "1 João 3:18" },
  { text: "Assim também a fé, se não tiver as obras, é morta em si mesma.", ref: "Tiago 2:17" },
  { text: "Pois eu tive fome, e vocês me deram de comer; tive sede, e vocês me deram de beber.", ref: "Mateus 25:35" },
  { text: "E não nos cansemos de fazer o bem, pois no tempo próprio colheremos.", ref: "Gálatas 6:9" },
  { text: "A religião pura e imaculada para com Deus é esta: visitar os órfãos e as viúvas.", ref: "Tiago 1:27" },
  { text: "O que se requer dos despenseiros é que cada um deles seja encontrado fiel.", ref: "1 Coríntios 4:2" },
  { text: "Servi uns aos outros conforme o dom que cada um recebeu.", ref: "1 Pedro 4:10" },
  { text: "Abre a tua boca a favor do mudo, pela causa de todos que são designados à destruição.", ref: "Provérbios 31:8" },
  { text: "Bem-aventurado é aquele que atende ao pobre; o Senhor o livrará no dia do mal.", ref: "Salmos 41:1" }
];

export const INITIAL_SITE_CONTENT: SiteContent = {
  heroTitle: 'Um lugar de fé, esperança e amor.',
  heroSubtitle: 'Junte-se a nós para adorar a Deus e crescer em comunhão. Você é nosso convidado especial.',
  heroButtonText: 'Conheça Nossa História',
  heroImageUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop', 
  nextEventTitle: 'Conferência de Família',
  nextEventDate: '2023-11-25',
  nextEventTime: '19:00',
  nextEventDescription: 'Uma noite especial para abençoar sua casa.',
  nextEventLocation: 'R. Icaraçu, 1110 - Barroso',
  youtubeLiveLink: 'https://youtube.com',
  
  socialProjectTitle: 'Projeto Amor em Ação',
  socialProjectDescription: 'Levando esperança e suprimento para as famílias da nossa comunidade através da distribuição de cestas básicas e apoio espiritual.',
  socialProjectItems: [
    { 
        imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070', 
        verse: "Pois eu tive fome, e vocês me deram de comer.", 
        verseReference: "Mateus 25:35" 
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070', 
        verse: "A fé, se não tiver as obras, é morta em si mesma.", 
        verseReference: "Tiago 2:17" 
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070', 
        verse: "Não amemos de palavra, mas por obra e em verdade.", 
        verseReference: "1 João 3:18" 
    }
  ]
};

export const INSPIRATIONAL_QUOTES: Quote[] = [
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", author: "João 3:16", type: "Bible" },
  { text: "Eu acredito no Cristianismo como acredito que o sol nasceu: não apenas porque o vejo, mas porque por meio dele vejo tudo o mais.", author: "C.S. Lewis", source: "O Peso da Glória", type: "Theology" },
  { text: "O evangelho é isto: Somos mais pecadores e falhos em nós mesmos do que jamais ousamos acreditar, mas ao mesmo tempo somos mais amados e aceitos em Jesus Cristo do que jamais ousamos esperar.", author: "Tim Keller", source: "O Deus Pródigo", type: "Theology" },
  { text: "A fé é uma confiança viva e ousada na graça de Deus, tão segura e certa que um homem poderia arriscar sua vida nela mil vezes.", author: "Martinho Lutero", source: "Prefácio aos Romanos", type: "Theology" },
  { text: "Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", author: "Romanos 8:28", type: "Bible" },
  { text: "Quase toda a sabedoria que possuímos, isto é, a verdadeira e sã sabedoria, consiste em duas partes: o conhecimento de Deus e de nós mesmos.", author: "João Calvino", source: "As Institutas", type: "Theology" },
  { text: "A cruz é o lugar onde a ira de Deus e o amor de Deus se encontram.", author: "D.A. Carson", type: "Theology" },
  { text: "O Senhor é o meu pastor, nada me faltará.", author: "Salmos 23:1", type: "Bible" },
  { text: "Deus sussurra em nossos prazeres, fala em nossa consciência, mas grita em nosso sofrimento: é o seu megafone para despertar um mundo surdo.", author: "C.S. Lewis", source: "O Problema do Sofrimento", type: "Theology" },
  { text: "Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente.", author: "Romanos 12:2", type: "Bible" },
  { text: "Você não tem alma. Você é uma alma. Você tem um corpo.", author: "C.S. Lewis", type: "Theology" },
  { text: "A paz não é a ausência de problemas, é a presença de Deus.", author: "Tim Keller", type: "Theology" },
  { text: "Mesmo que eu soubesse que o mundo acabaria amanhã, ainda plantaria minha macieira.", author: "Martinho Lutero", type: "Theology" }
];