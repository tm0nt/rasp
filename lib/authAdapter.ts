import { Adapter } from 'next-auth/adapters';
import { pool } from '@/lib/db';

export const customAdapter: Adapter = {
  async createUser(data) {
    const { email, name } = data;
    const id = crypto.randomUUID();
    const createdAt = new Date();
    await pool.query(
      `
      INSERT INTO users (id, email, name, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [id, email, name || null, true, createdAt, createdAt]
    );
    return { id, email, name: name || null };
  },
  async getUser(id) {
    const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },
  async getUserByEmail(email) {
    const result = await pool.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },
  async updateUser(data) {
    const { id, ...updates } = data;
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    await pool.query(`UPDATE users SET ${fields}, updated_at = NOW() WHERE id = $1`, [id, ...Object.values(updates)]);
    return { ...data };
  },
  async deleteUser(id) {
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
  },
  async createSession(data) {
    const { userId, sessionToken, expires } = data;
    const result = await pool.query(
      `
      INSERT INTO refresh_tokens (user_id, token, expires_at, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id AS "userId", token AS "sessionToken", expires_at AS expires
      `,
      [userId, sessionToken, expires, true, new Date()]
    );
    return result.rows[0];
  },
  async getSessionAndUser(sessionToken) {
    const sessionResult = await pool.query(
      `
      SELECT r.id, r.user_id AS "userId", r.token AS "sessionToken", r.expires_at AS expires,
             u.id AS "user.id", u.email AS "user.email", u.name AS "user.name"
      FROM refresh_tokens r
      JOIN users u ON r.user_id = u.id
      WHERE r.token = $1 AND r.is_active = true AND r.expires_at > NOW()
      `,
      [sessionToken]
    );
    if (!sessionResult.rows[0]) return null;
    const { userId, sessionToken: token, expires, ...userData } = sessionResult.rows[0];
    return {
      session: { userId, sessionToken: token, expires },
      user: userData.user,
    };
  },
  async updateSession(data) {
    const result = await pool.query(
      `
      UPDATE refresh_tokens
      SET expires_at = $1
      WHERE token = $2 AND is_active = true
      RETURNING user_id AS "userId", token AS "sessionToken", expires_at AS expires
      `,
      [data.expires, data.sessionToken]
    );
    return result.rows[0] || null;
  },
  async deleteSession(sessionToken) {
    await pool.query('UPDATE refresh_tokens SET is_active = false WHERE token = $1', [sessionToken]);
  },
  // Métodos não usados (para linkAccount, etc.) podem ser omitidos ou retornarem null se não precisar de OAuth
  async linkAccount() { return; },
  async unlinkAccount() { return; },
  async getUserByAccount() { return null; },
  async createVerificationToken() { return null; },
  async useVerificationToken() { return null; },
};