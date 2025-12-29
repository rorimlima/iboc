
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
  }
];

export const MOCK_EVENTS: ChurchEvent[] = [
  { id: '1', title: 'Culto de Celebração', start: '2023-10-29T18:00:00', end: '2023-10-29T20:00:00', type: 'Culto', location: 'Templo Principal' }
];

export const MOCK_SERMONS: Sermon[] = [
  { id: '1', title: 'A Fé que Move Montanhas', preacher: 'Pr. João Santos', date: '2023-10-22', series: 'Fé Inabalável', thumbnail: 'https://picsum.photos/400/225?random=1' }
];

export const SOCIAL_ACTION_VERSES = [
  { text: "Filhinhos, não amemos de palavra, nem de língua, mas por obra e em verdade.", ref: "1 João 3:18" },
  { text: "Assim também a fé, se não tiver as obras, é morta em si mesma.", ref: "Tiago 2:17" },
  { text: "Pois eu tive fome, e vocês me deram de comer; tive sede, e vocês me deram de beber.", ref: "Mateus 25:35" },
  { text: "E não nos cansemos de fazer o bem, pois no tempo próprio colheremos.", ref: "Gálatas 6:9" },
  { text: "A religião pura e imaculada para com Deus é esta: visitar os órfãos e as viúvas.", ref: "Tiago 1:27" }
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
        verseReference: "Mateus 25:35",
        registeredAt: 1700000000001
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070', 
        verse: "A fé, se não tiver as obras, é morta em si mesma.", 
        verseReference: "Tiago 2:17",
        registeredAt: 1700000000002
    },
    { 
        imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070', 
        verse: "Não amemos de palavra, mas por obra e em verdade.", 
        verseReference: "1 João 3:18",
        registeredAt: 1700000000003
    }
  ]
};

export const INSPIRATIONAL_QUOTES: Quote[] = [
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", author: "João 3:16", type: "Bible" }
];
