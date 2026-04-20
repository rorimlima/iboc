
-- Supabase Schema for IBOC Project

-- 1. Members Table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fullName TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    birthDate DATE,
    photoUrl TEXT,
    fatherName TEXT,
    motherName TEXT,
    maritalStatus TEXT,
    address TEXT,
    neighborhood TEXT,
    city TEXT,
    baptismDate DATE,
    receptionDate DATE,
    receptionType TEXT,
    status TEXT DEFAULT 'Ativo',
    previousChurch TEXT,
    role TEXT DEFAULT 'Membro',
    ministries TEXT[],
    spiritualGifts TEXT,
    lastAttendance DATE,
    attendanceRate DECIMAL,
    username TEXT UNIQUE,
    password TEXT,
    permissions TEXT DEFAULT 'viewer',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Accounts Table (formerly bank_accounts)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    bankName TEXT,
    agency TEXT,
    accountNumber TEXT,
    pixKey TEXT,
    pixHolder TEXT,
    initialBalance DECIMAL DEFAULT 0,
    description TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Financial Table (formerly transactions)
CREATE TABLE IF NOT EXISTS financial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'Entrada' | 'Saída'
    category TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    contributorName TEXT,
    paymentMethod TEXT,
    bankAccount TEXT, -- Changed from UUID to TEXT to match simple string storage in component
    attachmentUrl TEXT,
    closingStatus TEXT DEFAULT 'Aberto',
    closingId TEXT,
    isReconciled BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Events Table (formerly church_events)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    start TIMESTAMP WITH TIME ZONE NOT NULL,
    "end" TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL,
    location TEXT,
    description TEXT,
    bannerUrl TEXT,
    roster JSONB, 
    linkedProjectId UUID,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Social Projects Table
CREATE TABLE IF NOT EXISTS social_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    location TEXT,
    bannerUrl TEXT,
    status TEXT DEFAULT 'Planejamento',
    gallery JSONB, 
    showInCalendar BOOLEAN DEFAULT TRUE,
    linkedEventId UUID,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    acquisitionDate DATE,
    value DECIMAL,
    quantity INTEGER DEFAULT 1,
    condition TEXT,
    status TEXT,
    location TEXT,
    photoUrl TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Maintenance Records Table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assetId UUID REFERENCES assets(id),
    date DATE NOT NULL,
    description TEXT,
    cost DECIMAL,
    provider TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Site Content Table (Singleton)
CREATE TABLE IF NOT EXISTS site_content (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    heroTitle TEXT,
    heroSubtitle TEXT,
    heroButtonText TEXT,
    heroImageUrl TEXT,
    nextEventTitle TEXT,
    nextEventDate DATE,
    nextEventTime TEXT,
    nextEventDescription TEXT,
    nextEventLocation TEXT,
    nextEventBannerUrl TEXT,
    youtubeLiveLink TEXT,
    socialProjectTitle TEXT,
    socialProjectDescription TEXT,
    socialProjectItems JSONB,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initialize site_content if empty
INSERT INTO site_content (id, heroTitle) 
VALUES (1, 'Bem-vindo à IBOC')
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- 1. Public Access Policies (Read-Only for specific tables)
CREATE POLICY "Public read site_content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read projects" ON social_projects FOR SELECT USING (true);
CREATE POLICY "Public read sermons" ON sermons FOR SELECT USING (true);

-- 2. Authenticated Access 
CREATE POLICY "Full access for authenticated users" ON members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON accounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON financial FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON sermons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON social_projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON assets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON maintenance_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access for authenticated users" ON site_content FOR ALL USING (auth.role() = 'authenticated');
