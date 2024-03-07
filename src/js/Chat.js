// const ws = new WebSocket('ws://localhost:7070/ws');
const ws = new WebSocket('wss://chat-backend-servereu.onrender.com/ws');

export default class Chat {
  constructor(container) {
    this.container = container;

    this.wsMessage = this.wsMessage.bind(this);
    this.onInputName = this.onInputName.bind(this);
    this.onSubmitName = this.onSubmitName.bind(this);
    this.onSubmitMessage = this.onSubmitMessage.bind(this);
  }

  init() {
    this.drawChat();
    this.registerEvents();
  }

  drawChat() {
    this.container.innerHTML = `
      <div class="reg">
        <div class="reg-content">
          <h5 class="reg-title">Выберите псевдоним</h5>
          <form class="reg-form">
            <input class="form-input" type="text" minlength="3" maxlength="15">
            <div class="form-control">
              <button class="button">Продолжить</button>
            </div>
          </form>
        </div>
      </div>
      <div class="chat hidden">
        <div class="chat-content">
          <div class="chat-users">
            <ul class="users-list"></ul>
          </div>
          <form class="chat-window">
            <ul class="messages-list"></ul>
            <input class="message-input" type="text" placeholder="Type your message here...">
          </form>
        </div>
      </div>`;

    this.reg = document.querySelector('.reg');
    this.regForm = this.reg.querySelector('.reg-form');
    this.regInput = this.reg.querySelector('.form-input');

    this.regMessage = document.createElement('div');
    this.regMessage.classList.add('form-message');
    this.regMessage.textContent = 'Данный псевдоним уже занят';

    this.chat = document.querySelector('.chat');
    this.chatUsersList = this.chat.querySelector('.users-list');
    this.chatMessagesList = this.chat.querySelector('.messages-list');
    this.chatForm = this.chat.querySelector('.chat-window');
    this.chatInput = this.chat.querySelector('.message-input');
  }

  registerEvents() {
    ws.addEventListener('message', this.wsMessage);

    this.regForm.addEventListener('input', this.onInputName);
    this.regForm.addEventListener('submit', this.onSubmitName);
    this.chatForm.addEventListener('submit', this.onSubmitMessage);
  }

  onInputName(event) {
    event.preventDefault();

    const { value } = this.regInput;

    if (value) {
      const isValidValue = /^[\S.]*$/.test(value);

      if (isValidValue) {
        if (this.regForm.querySelector('.form-message')) {
          this.regForm.removeChild(this.regMessage);
        }

        this.userName = value;
      } else {
        this.regInput.value = value.slice(0, -1);
      }
    }
  }

  onSubmitName(event) {
    event.preventDefault();

    if (this.userName) {
      ws.send(JSON.stringify({ user: { name: this.userName } }));
    }
  }

  onSubmitMessage(event) {
    event.preventDefault();

    const messageText = this.chatInput.value;

    if (messageText) {
      const message = JSON.stringify({
        message: {
          creator: this.userName,
          text: messageText,
          created: new Date().getTime(),
        },
      });

      ws.send(message);
      this.chatInput.value = '';
    }
  }

  wsMessage(event) {
    const data = JSON.parse(event.data);
    const { user, userExists } = data;
    const { usersDB, chatDB } = data;

    if (user) {
      this.reg.classList.add('hidden');
      this.chat.classList.remove('hidden');
    }

    if (usersDB) {
      this.chatUsersList.innerHTML = '';

      usersDB.forEach((item) => {
        if (item.name === this.userName) {
          const userHTML = `
            <li class="user">
              <div class="user-avatar"></div>
              <p class="user-name font-red">You</p>
            </li>`;

          this.chatUsersList.insertAdjacentHTML('afterbegin', userHTML);
        } else {
          const userHTML = `
            <li class="user">
              <div class="user-avatar"></div>
              <p class="user-name">${item.name}</p>
            </li>`;

          this.chatUsersList.insertAdjacentHTML('beforeend', userHTML);
        }
      });
    }

    if (chatDB) {
      this.chatMessagesList.innerHTML = '';

      chatDB.forEach((item) => {
        if (item.creator === this.userName) {
          const messageHTML = `
            <li class="message message-creator">
              <div class="message-content message-content-creator">
                <div class="message-info font-red">You, ${Chat.formatDate(item.created)}</div>
                <div class="message-text">${item.text}</div>
              </div>
            </li>`;

          this.chatMessagesList.insertAdjacentHTML('afterbegin', messageHTML);
        } else {
          const messageHTML = `
            <li class="message">
              <div class="message-content">
                <div class="message-info">${item.creator}, ${Chat.formatDate(item.created)}</div>
                <div class="message-text">${item.text}</div>
              </div>
            </li>`;

          this.chatMessagesList.insertAdjacentHTML('afterbegin', messageHTML);
        }
      });
    }

    if (userExists) {
      this.regInput.insertAdjacentElement('afterend', this.regMessage);
    }
  }

  static formatDate(date) {
    const dateFormatter = new Intl.DateTimeFormat('ru-RU');
    const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
      hour: 'numeric',
      minute: 'numeric',
    });
    const formatedDate = `${timeFormatter.format(date)} ${dateFormatter.format(date)}`;

    return formatedDate;
  }
}
