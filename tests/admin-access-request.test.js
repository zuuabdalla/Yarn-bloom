jest.mock('../config/database', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));

const db = require('../config/database');
const AdminAccessRequest = require('../models/AdminAccessRequest');

describe('admin access request model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('approves a pending request and creates a regular admin in one transaction', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      execute: jest.fn()
        .mockResolvedValueOnce([[
          {
            id: 8,
            username: 'new.admin',
            email: 'new.admin@example.com',
            password_hash: 'bcrypt-hash',
            status: 'pending'
          }
        ]])
        .mockResolvedValueOnce([{ insertId: 4 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn()
    };
    db.getConnection.mockResolvedValue(connection);

    await expect(AdminAccessRequest.approveAndCreateAdmin(8, 2)).resolves.toBe(4);

    expect(connection.execute).toHaveBeenNthCalledWith(2, expect.stringContaining("VALUES (?, ?, ?, 'admin')"), [
      'new.admin',
      'new.admin@example.com',
      'bcrypt-hash'
    ]);
    expect(connection.execute).toHaveBeenNthCalledWith(3, expect.stringContaining("password_hash = NULL"), [2, 8]);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test('does not create an account when a request is no longer pending', async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      execute: jest.fn().mockResolvedValueOnce([[
        { id: 8, status: 'rejected' }
      ]]),
      commit: jest.fn(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn()
    };
    db.getConnection.mockResolvedValue(connection);

    await expect(AdminAccessRequest.approveAndCreateAdmin(8, 2))
      .rejects.toMatchObject({ code: 'ADMIN_ACCESS_REQUEST_NOT_PENDING' });

    expect(connection.execute).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
});
