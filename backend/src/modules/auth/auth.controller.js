const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../../repositories/user.repository');
const { JWT_SECRET } = require('../../middlewares/auth.middleware');

function getDeviceLabel(userAgent = '') {
  if (!userAgent) return 'Perangkat tidak dikenal';

  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iPhone / iPad';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac os x|macintosh/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';

  return 'Perangkat web';
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function getEmailCandidates(email = '') {
  const normalized = email.trim().toLowerCase();
  const candidates = [normalized];

  if (normalized.endsWith('@hygiopark.io')) {
    candidates.push(normalized.replace('@hygiopark.io', '@parkwise.io'));
  } else if (normalized.endsWith('@parkwise.io')) {
    candidates.push(normalized.replace('@parkwise.io', '@hygiopark.io'));
  }

  return [...new Set(candidates)];
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password minimal 6 karakter' });

    const normalizedEmail = email.trim().toLowerCase();
    const existingCandidates = await Promise.all(
      getEmailCandidates(normalizedEmail).map((candidate) =>
        userRepository.findByEmail(candidate)
      )
    );
    const existing = existingCandidates.find(Boolean);
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      role: 'user',
    });

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registrasi gagal' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email dan password wajib diisi' });

    const normalizedEmail = email.trim().toLowerCase();
    const candidates = getEmailCandidates(normalizedEmail);
    let user = null;

    for (const candidate of candidates) {
      user = await userRepository.findByEmail(candidate);
      if (user) break;
    }

    if (!user) return res.status(401).json({ error: 'Kredensial tidak valid' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Kredensial tidak valid' });

    if (!user.isActive) return res.status(403).json({ error: 'Akun dinonaktifkan' });

    const nextData = {
      lastLoginAt: new Date(),
      lastLoginDevice: getDeviceLabel(req.headers['user-agent']),
    };

    if (normalizedEmail.endsWith('@hygiopark.io') && user.email !== normalizedEmail) {
      const targetEmailTaken = await userRepository.findByEmail(normalizedEmail);
      if (!targetEmailTaken || targetEmailTaken.id === user.id) {
        nextData.email = normalizedEmail;
      }
    }

    const updatedUser = await userRepository.update(user.id, nextData);

    const token = signToken({ ...user, ...updatedUser });
    const { password: _, ...safeUser } = { ...user, ...updatedUser };
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login gagal' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
}

module.exports = { register, login, me };


