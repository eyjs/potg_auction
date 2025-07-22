import { User } from '../models/User.js';
import { StorageService } from './StorageService.js';

export class UserService {
  constructor(users = []) {
    this.users = users;
  }

  register(username, password) {
    if (!username || !password) {
      return { success: false, message: '사용자 이름과 비밀번호를 입력하세요.' };
    }
    if (this.users.some((u) => u.username === username)) {
      return { success: false, message: '이미 존재하는 사용자 이름입니다.' };
    }

    const newUser = new User({
      id: `user_${Date.now()}`,
      username,
      password,
      role: 'general',
      teamId: null,
      points: 0,
    });

    this.users.push(newUser);
    this.save();
    return { success: true, message: `사용자 '${username}'이(가) 등록되었습니다.` };
  }

  getAll() {
    return this.users;
  }

  save() {
    StorageService.save('users', this.users);
  }
}
