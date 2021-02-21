import React, { Component, PureComponent } from 'react';
import ReactDOM from 'react-dom';

import TimeAgo from 'react-timeago';
import chineseStrings from 'react-timeago/lib/language-strings/zh-CN';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

import './login.css';

import { API_ROOT } from './old_infrastructure/const';
import { get_json, API_VERSION_PARAM } from './old_infrastructure/functions';

import {
    GoogleReCaptchaProvider,
    GoogleReCaptcha,
} from 'react-google-recaptcha-v3';
import ReCAPTCHA from 'react-google-recaptcha';

const LOGIN_POPUP_ANCHOR_ID = 'pkuhelper_login_popup_anchor';

class LoginPopupSelf extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading_status: 'idle',
      recaptcha_verified: false,
      phase: -1,
      // excluded_scopes: [],
    };

    this.ref = {
      username: React.createRef(),
      email_verification: React.createRef(),
      password: React.createRef(),
      password_confirm: React.createRef(),

      checkbox_terms: React.createRef(),
      checkbox_account: React.createRef()
    };

    this.popup_anchor = document.getElementById(LOGIN_POPUP_ANCHOR_ID);
    if (!this.popup_anchor) {
      this.popup_anchor = document.createElement('div');
      this.popup_anchor.id = LOGIN_POPUP_ANCHOR_ID;
      document.body.appendChild(this.popup_anchor);
    }
  }

  next_step() {
    if (this.state.loading_status === 'loading') return;
    switch (this.state.phase) {
      case -1: this.verify_email(); break;
      case 0: this.do_login(this.props.token_callback); break;
      case 1: this.new_user_registration(); break;
      case 2: this.old_user_registration(); break;
      case 3: this.need_recaptcha(); break;
    }
  }

  valid_registration() {
    if (!this.ref.checkbox_terms.current.checked || !this.ref.checkbox_account.current.checked) {
      alert('请同意条款与条件！');
      return 1;
    }
    if (this.ref.password.current.value !== this.ref.password_confirm.current.value) {
      alert('密码不一致！');
      return 2;
    }
    return 0;
  }

  async sha256(message) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new ArrayBuffer(message));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  async hashpassword(password) {
    let password_hashed = await this.sha256(password);
    password_hashed = await this.sha256(password_hashed);
    password_hashed = encodeURIComponent(password_hashed);
    return password_hashed;
  }

  verify_email() {
    const old_token = new URL(location.href).searchParams.get('old_token');
    const email = encodeURIComponent(this.ref.username.current.value);
    this.setState(
      {
        loading_status: 'loading',
      },
      () => {
        fetch(
          API_ROOT +
          'security/login/check_email?v=v1.2.3&device=0' +
          API_VERSION_PARAM(), {
          method: 'POST',
          body: JSON.stringify({
            email,
            old_token
          }),
        },
        )
          .then((res) => res.json())
          .then((json) => {
            // COMMENT NEXT LINE
            //json.code = 1;
            if (json.code < 0) throw new Error(json.msg);
            this.setState({
              loading_status: 'done',
              phase: json.code
            });
          })
          .catch((e) => {
            alert('邮箱检验失败\n' + e);
            this.setState({
              loading_status: 'done',
            });
            console.error(e);
          });
      },
    );
  }

  do_login(set_token) {
    this.setState(
      {
        loading_status: 'loading',
      },
      () => {
        fetch(
          API_ROOT +
          'security/login/login?v=v1.2.3&device=0' +
          API_VERSION_PARAM(),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              excluded_scopes: [],
            }),
          },
        )
          .then(get_json)
          .then((json) => {
            if (json.code !== 0) {
              if (json.msg) throw new Error(json.msg);
              throw new Error(JSON.stringify(json));
            }

            set_token(json.token);
            alert(`登录成功`);
            this.setState({
              loading_status: 'done',
            });
            this.props.on_close();
          })
          .catch((e) => {
            console.error(e);
            alert('登录失败\n' + e);
            this.setState({
              loading_status: 'done',
            });
          });
      },
    );
  }

  async new_user_registration() {
    if (this.valid_registration() !== 0) return;
    const email = encodeURIComponent(this.ref.username.current.value);
    const valid_code = encodeURIComponent(this.ref.email_verification.current.value);
    const password = this.ref.password.current.value;
    let password_hashed = await this.hashpassword(password);
    this.setState(
      {
        loading_status: 'loading',
      },
      () => {
        fetch(
          API_ROOT +
          'security/login/create_account?v=v1.2.3&device=0' +
          API_VERSION_PARAM(),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password_hashed,
              device_typeL: 0,
              device_info: navigator.userAgent,
              valid_code
            }),
          },
        )
          .then(get_json)
          .then((json) => {
            if (json.code !== 0) {
              if (json.msg) throw new Error(json.msg);
              throw new Error(JSON.stringify(json));
            }

            set_token(json.token);
            alert(`登录成功`);
            this.setState({
              loading_status: 'done',
            });
            this.props.on_close();
          })
          .catch((e) => {
            console.error(e);
            alert('登录失败\n' + e);
            this.setState({
              loading_status: 'done',
            });
          });
      },
    );
  }

  async old_user_registration() {
    if (this.valid_registration() !== 0) return;
    const email = encodeURIComponent(this.ref.username.current.value);
    const old_token = new URL(location.href).searchParams.get('old_token');
    const password = this.ref.password.current.value;
    let password_hashed = await this.hashpassword(password);
    this.setState(
      {
        loading_status: 'loading',
      },
      () => {
        fetch(
          API_ROOT +
          'security/login/create_account?v=v1.2.3&device=0' +
          API_VERSION_PARAM(),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password_hashed,
              device_typeL: 0,
              device_info: navigator.userAgent,
              old_token
            }),
          },
        )
          .then(get_json)
          .then((json) => {
            if (json.code !== 0) {
              if (json.msg) throw new Error(json.msg);
              throw new Error(JSON.stringify(json));
            }

            set_token(json.token);
            alert(`登录成功`);
            this.setState({
              loading_status: 'done',
            });
            this.props.on_close();
          })
          .catch((e) => {
            console.error(e);
            alert('登录失败\n' + e);
            this.setState({
              loading_status: 'done',
            });
          });
      },
    );
  }

  need_recaptcha() {
    console.log(3);
  }

  do_sendcode(type, do_popup, recaptcha_version) {
    if (!this.state.recaptcha_verified) {
      alert('reCAPTCHA风控系统正在评估您的浏览器安全状态，请稍后重试。');
      return;
    }

    this.setState(
      {
        loading_status: 'loading',
      },
      () => {
        fetch(
          API_ROOT +
          'security/login/send_code' +
          '?user=' +
          encodeURIComponent(this.ref.username.current.value) +
          '&code_type=' +
          encodeURIComponent(type) +
          '&recaptcha_version=' +
          encodeURIComponent(recaptcha_version) +
          '&recaptcha_token=' +
          localStorage['recaptcha'] +
          API_VERSION_PARAM(),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              excluded_scopes: [],
            }),
          },
        )
          .then(get_json)
          .then((json) => {
            console.log(json);
            if (!json.success) throw new Error(JSON.stringify(json));

            alert(json.msg);
            this.setState({
              loading_status: 'done',
            });
          })
          .catch((e) => {
            console.error(e);

            if (e.toString().includes('风控系统校验失败')) {
              this.setState({
                loading_status: 'done',
              });
              do_popup();
            } else {
              alert('发送失败\n' + e);
              this.setState({
                loading_status: 'done',
              });
            }
          });
      },
    );
  }

  render() {
    window.recaptchaOptions = {
      useRecaptchaNet: true,
    };
    return ReactDOM.createPortal(
      <GoogleReCaptchaProvider
        reCaptchaKey={process.env.REACT_APP_RECAPTCHA_V3_KEY}
        useRecaptchaNet={true}
      >
        {!this.state.recaptcha_verified && (
          <GoogleReCaptcha
            onVerify={(token) => {
              this.setState({
                recaptcha_verified: true,
              });
              console.log(token);
              localStorage['recaptcha'] = token;
            }}
          />
        )}
        <div>
          <div className="treehollow-login-popup-shadow" />
          <div className="treehollow-login-popup">
            {this.state.phase === -1 && (
              <>
                <p>
                  <b>输入邮箱来登录 {process.env.REACT_APP_TITLE}</b>
                </p>
                <p>
                  <label>
                    邮箱&nbsp;
                    <input
                      ref={this.ref.username}
                      type="email"
                      autoFocus={true}
                      defaultValue="example@example.com"
                    />
                  </label>
                </p>
              </>)}
            {this.state.phase === 0 && (
              <>
                <p>
                  <b>输入密码来登录 {process.env.REACT_APP_TITLE}</b>
                </p>
                <p>
                  <label>
                    密码&nbsp;
                    <input
                      ref={this.ref.password}
                      type="password"
                      autoFocus={true}
                    />
                  </label>
                </p>
                <p><a href='#'>忘记密码？</a></p>
              </>)}
            {this.state.phase === 1 && (
              <>
                <p>
                  <b>{process.env.REACT_APP_TITLE} 新用户注册</b>
                </p>
                <p>
                  <label>
                    邮箱验证码&nbsp;
                    <input
                      ref={this.ref.email_verification}
                      type="tel"
                      autoFocus={true}
                    />
                  </label>
                </p>
              </>
            )}
            {this.state.phase === 2 && (
              <>
                <p>
                  <b>{process.env.REACT_APP_TITLE} 老用户注册</b>
                </p>
              </>
            )}
            {(this.state.phase === 1 || this.state.phase === 2) && (
              <>
                <p>
                  <label>
                    密码&nbsp;
                    <input
                      ref={this.ref.password}
                      type="password"
                    />
                  </label>
                </p>
                <p>
                  <label>
                    密码确认&nbsp;
                    <input
                      ref={this.ref.password_confirm}
                      type="password"
                    />
                  </label>
                </p>
                <p>
                  <label>
                    <input
                      type="checkbox"
                      ref={this.ref.checkbox_terms}
                    />
                    I agree xxx terms.
                  </label>
                </p>
                <p>
                  <label>
                    <input
                      type="checkbox"
                      ref={this.ref.checkbox_account}
                    />
                    I agree that if I forget my password, I would lose my account.
                  </label>
                </p>
              </>)}
            {this.state.phase === 3 && (
              <>
                <p>
                  <b>输入验证码 {process.env.REACT_APP_TITLE}</b>
                </p>
                <p>
                  <label>
                    邮箱&nbsp;
                    <input
                      ref={this.ref.username}
                      type="email"
                      autoFocus={true}
                      defaultValue="@mails.tsinghua.edu.cn"
                    />
                  </label>
                </p>
              </>)}
            <p>
              <button onClick={this.next_step.bind(this)}>下一步</button>
            </p>
          </div>
        </div>
      </GoogleReCaptchaProvider>,
      this.popup_anchor,
    );
  }
}

export class LoginPopup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      popup_show: false
    };
    this.on_popup_bound = this.on_popup.bind(this);
    this.on_close_bound = this.on_close.bind(this);
  }

  on_popup() {
    this.setState({
      popup_show: true,
    });
  }

  on_close() {
    this.setState({
      popup_show: false,
    });
  }

  render() {
    return (
      <>
        {this.props.children(this.on_popup_bound)}
        {this.state.popup_show && (
          <LoginPopupSelf
            token_callback={this.props.token_callback}
            on_close={this.on_close_bound}
          />
        )}
      </>
    );
  }
}
