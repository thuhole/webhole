import React, { Component } from 'react';
import {
  SafeTextarea,
  PromotionBar,
  HighlightedMarkdown,
  BrowserWarningBar,
} from './Common';
import { MessageViewer } from './Message';
import { LoginPopup } from './login';
import { ColorPicker } from './color_picker';
import { ConfigUI } from './Config';
import fixOrientation from 'fix-orientation';
import copy from 'copy-to-clipboard';
import { cache } from './cache';
import {
  // API_VERSION_PARAM,
  // THUHOLE_API_ROOT,
  // API,
  get_json,
  API_ROOT,
  API_VERSION_PARAM,
} from './flows_api';

import './UserAction.css';

const BASE64_RATE = 4 / 3;
const MAX_IMG_DIAM = 8000;
const MAX_IMG_PX = 5000000;
const MAX_IMG_FILESIZE = 450000 * BASE64_RATE;

export const TokenCtx = React.createContext({
  value: null,
  set_value: () => { },
});

export function DoUpdate(clear_cache = true) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        console.log('unregister', registration);
        registration.unregister();
      }
    });
  }
  if (clear_cache) cache().clear();
  setTimeout(() => {
    window.location.reload(true);
  }, 1000);
}

export function InfoSidebar(props) {
  return (
    <div>
      <PromotionBar />
      <BrowserWarningBar />
      <LoginForm show_sidebar={props.show_sidebar} />
      <div className="box list-menu">
        <a
          onClick={() => {
            props.show_sidebar('设置', <ConfigUI />);
          }}
        >
          <span className="icon icon-settings" />
          <label>设置</label>
        </a>
        &nbsp;&nbsp;
        <a href={process.env.REACT_APP_RULES_URL} target="_blank">
          <span className="icon icon-textfile" />
          <label>树洞规范</label>
        </a>
        &nbsp;&nbsp;
        <a href={process.env.REACT_APP_GITHUB_ISSUES_URL} target="_blank">
          <span className="icon icon-github" />
          <label>意见反馈</label>
        </a>
      </div>
      <div className="box help-desc-box">
        <p>
          <a onClick={DoUpdate}>强制检查更新</a>
          （当前版本：【{process.env.REACT_APP_BUILD_INFO || '---'}{' '}
          {process.env.NODE_ENV}】 会自动在后台检查更新并在下次访问时更新）
        </p>
      </div>
      <div className="box help-desc-box">
        <p>联系我们：{process.env.REACT_APP_CONTACT_EMAIL}</p>
      </div>
      <div className="box help-desc-box">
        <p>
          {process.env.REACT_APP_TITLE} 网页版 by @
          {process.env.REACT_APP_GITHUB_USER}， 基于&nbsp;
          <a
            href="https://www.gnu.org/licenses/gpl-3.0.zh-cn.html"
            target="_blank"
          >
            GPLv3
          </a>
          &nbsp;协议在{' '}
          <a href={process.env.REACT_APP_GITHUB_WEB_URL} target="_blank">
            GitHub
          </a>{' '}
          开源
        </p>
        <p>
          {process.env.REACT_APP_TITLE} 网页版的诞生离不开&nbsp;
          <a
            href="https://github.com/pkuhelper-web/webhole"
            target="_blank"
            rel="noopener"
          >
            P大树洞网页版 by @xmcp
          </a>
          、
          <a href="https://reactjs.org/" target="_blank" rel="noopener">
            React
          </a>
          、
          <a href="https://icomoon.io/#icons" target="_blank" rel="noopener">
            IcoMoon
          </a>
          &nbsp;等开源项目
        </p>
        <p>
          This program is free software: you can redistribute it and/or modify
          it under the terms of the GNU General Public License as published by
          the Free Software Foundation, either version 3 of the License, or (at
          your option) any later version.
        </p>
        <p>
          This program is distributed in the hope that it will be useful, but
          WITHOUT ANY WARRANTY; without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the&nbsp;
          <a
            href="https://www.gnu.org/licenses/gpl-3.0.zh-cn.html"
            target="_blank"
          >
            GNU General Public License
          </a>
          &nbsp;for more details.
        </p>
      </div>
    </div>
  );
}

export class LoginForm extends Component {
  copy_token(token) {
    if (copy(token))
      alert(
        '复制成功！\n请一定不要泄露给其他人，或在' +
        process.env.REACT_APP_WEBSITE_URL +
        '以外的其他网站中输入token，否则可能会导致信息泄漏哦',
      );
  }

  render() {
    return (
      <TokenCtx.Consumer>
        {(token) => (
          <div>
            <div className="login-form box">
              {token.value ? (
                <div>
                  <p>
                    <b>您已登录。</b>
                    <button
                      type="button"
                      onClick={() => {
                        token.set_value(null);
                      }}
                    >
                      <span className="icon icon-logout" /> 注销
                    </button>
                    <br />
                  </p>
                  <p>
                    <a
                      onClick={() => {
                        this.props.show_sidebar(
                          '系统消息',
                          <MessageViewer token={token.value} />,
                        );
                      }}
                    >
                      查看系统消息
                    </a>
                    <br />
                    当您发送的内容违规时，我们将用系统消息提示您
                  </p>
                  <p>
                    <a onClick={this.copy_token.bind(this, token.value)}>
                      复制 User Token
                    </a>
                    <br />
                    复制 User Token
                    可以在新设备登录，切勿告知他人。若怀疑被盗号请重新邮箱验证码登录以重置Token。
                  </p>
                </div>
              ) : (
                <LoginPopup token_callback={token.set_value}>
                  {(do_popup) => (
                    <div>
                      <p>
                        <button type="button" onClick={do_popup}>
                          <span className="icon icon-login" />&nbsp;登录
                        </button>
                      </p>
                      <p>
                        <small>
                          {process.env.REACT_APP_TITLE}面向T大学生，通过T大邮箱验证您的身份并提供服务。
                        </small>
                      </p>
                    </div>
                  )}
                </LoginPopup>
                )}
            </div>
          </div>
        )}
      </TokenCtx.Consumer>
    );
  }
}

export class VoteEditBox extends Component{
  constructor(props){
    super(props)
    this.onChangeCheckAndSend = this.checkAndSend.bind(this)
  }
  checkAndSend(order){
    return (value)=>{
      const {sendVoteData} = this.props
      sendVoteData({[order]:value})
    }
  }
  render(){
    let {num} = this.props
    const inputPile = [];
    for (let i = 0; i < num; i+=1) {
      inputPile.push(
        <input 
          key={i} 
          maxLength="20"
          style={{padding:'0 2px',margin:'2px 2px'}} 
          onChange={(event)=>{this.onChangeCheckAndSend(i+1)(event.target.value)}} 
          placeholder={i+1}/>          
      );
    }
    return (
      <div>
        <hr/>
        <p>设置2~4个选项，每项不超过20字符</p>
        {inputPile}
      </div>
    )
  }
}

export class PostForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      loading_status: 'done',
      img_tip: null,
      preview: false,
      vote:false,
      voteOptionNum: 0,
      voteData: {1:null,2:null,3:null,4:null},
    };
    this.img_ref = React.createRef();
    this.area_ref = this.props.area_ref || React.createRef();
    this.on_change_bound = this.on_change.bind(this);
    this.on_img_change_bound = this.on_img_change.bind(this);
    this.global_keypress_handler_bound = this.global_keypress_handler.bind(
      this,
    );
    this.color_picker = new ColorPicker();
  }

  global_keypress_handler(e) {
    if (
      e.code === 'Enter' &&
      !e.ctrlKey &&
      !e.altKey &&
      ['input', 'textarea'].indexOf(e.target.tagName.toLowerCase()) === -1
    ) {
      if (this.area_ref.current) {
        e.preventDefault();
        this.area_ref.current.focus();
      }
    }
  }
  componentDidMount() {
    document.addEventListener('keypress', this.global_keypress_handler_bound);
  }
  componentWillUnmount() {
    document.removeEventListener(
      'keypress',
      this.global_keypress_handler_bound,
    );
  }

  on_change(value) {
    this.setState({
      text: value,
    });
  }

  do_post(text, img) {
    let data = new URLSearchParams();
    let path;
    if (this.props.action === 'docomment') {
      data.append('pid', this.props.pid);
      path = 'send/comment?';
    } else {
      path = 'send/post?';
    }
    data.append('text', this.state.text);
    data.append('type', img ? 'image' : 'text');
    if (img) data.append('data', img);
    // 投票
    if (this.state.vote) {
      let voteObj = this.state.voteData
      Object.keys(voteObj).forEach(item=>{
        if(!voteObj[item])  delete voteObj[item]
      })
      let voteArray = Object.values(voteObj)
      voteArray.map((char)=>{
        data.append('vote_options[]', char);
      })
    }
    
    // fetch发送
    fetch(API_ROOT + path + API_VERSION_PARAM(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        TOKEN: this.props.token,
      },
      body: data,
    })
      .then(get_json)
      .then((json) => {
        if (json.code !== 0) {
          if (json.msg) alert(json.msg);
          throw new Error(JSON.stringify(json));
        }
        this.setState({
          loading_status: 'done',
          text: '',
          preview: false,
        });
        this.area_ref.current.clear();
        this.props.on_complete();
      })
      .catch((e) => {
        console.error(e);
        alert('发表失败');
        this.setState({
          loading_status: 'done',
        });
      });
  }

  proc_img(file) {
    return new Promise((resolve, reject) => {
      function return_url(url) {
        const idx = url.indexOf(';base64,');
        if (idx === -1) throw new Error('img not base64 encoded');

        return url.substr(idx + 8);
      }

      let reader = new FileReader();
      function on_got_img(url) {
        const image = new Image();
        image.onload = () => {
          let width = image.width;
          let height = image.height;
          let compressed = false;

          if (width > MAX_IMG_DIAM) {
            height = (height * MAX_IMG_DIAM) / width;
            width = MAX_IMG_DIAM;
            compressed = true;
          }
          if (height > MAX_IMG_DIAM) {
            width = (width * MAX_IMG_DIAM) / height;
            height = MAX_IMG_DIAM;
            compressed = true;
          }
          if (height * width > MAX_IMG_PX) {
            let rate = Math.sqrt((height * width) / MAX_IMG_PX);
            height /= rate;
            width /= rate;
            compressed = true;
          }
          console.log('chosen img size', width, height);

          let canvas = document.createElement('canvas');
          let ctx = canvas.getContext('2d');
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(image, 0, 0, width, height);

          let quality_l = 0.1,
            quality_r = 0.9,
            quality,
            new_url;
          while (quality_r - quality_l >= 0.03) {
            quality = (quality_r + quality_l) / 2;
            new_url = canvas.toDataURL('image/jpeg', quality);
            console.log(
              quality_l,
              quality_r,
              'trying quality',
              quality,
              'size',
              new_url.length,
            );
            if (new_url.length <= MAX_IMG_FILESIZE) quality_l = quality;
            else quality_r = quality;
          }
          if (quality_l >= 0.101) {
            console.log('chosen img quality', quality);
            resolve({
              img: return_url(new_url),
              quality: quality,
              width: Math.round(width),
              height: Math.round(height),
              compressed: compressed,
            });
          } else {
            reject('图片过大，无法上传');
          }
        };
        image.src = url;
      }
      reader.onload = (event) => {
        fixOrientation(event.target.result, {}, (fixed_dataurl) => {
          on_got_img(fixed_dataurl);
        });
      };
      reader.readAsDataURL(file);
    });
  }

  on_img_change() {
    if (this.img_ref.current && this.img_ref.current.files.length)
      this.setState(
        {
          img_tip: '（正在处理图片……）',
        },
        () => {
          this.proc_img(this.img_ref.current.files[0])
            .then((d) => {
              this.setState({
                img_tip:
                  `（${d.compressed ? '压缩到' : '尺寸'} ${d.width}*${d.height
                  } / ` +
                  `质量 ${Math.floor(d.quality * 100)}% / ${Math.floor(
                    d.img.length / BASE64_RATE / 1000,
                  )}KB）`,
              });
            })
            .catch((e) => {
              this.setState({
                img_tip: `图片无效：${e}`,
              });
            });
        },
      );
    else
      this.setState({
        img_tip: null,
      });
  }

  on_submit(event) {
    if (event) event.preventDefault();
    if (this.state.loading_status === 'loading') return;
    if (this.img_ref.current.files.length) {
      this.setState({
        loading_status: 'processing',
      });
      this.proc_img(this.img_ref.current.files[0])
        .then((d) => {
          this.setState({
            loading_status: 'loading',
          });
          this.do_post(this.state.text, d.img);
        })
        .catch((e) => {
          alert(e);
        });
    } else {
      this.setState({
        loading_status: 'loading',
      });
      this.do_post(this.state.text, null);
    }
  }

  toggle_preview() {
    this.setState({
      preview: !this.state.preview,
    });
  }

  addVote() {
    let { voteOptionNum } = this.state
    if (voteOptionNum >= 4) {
      alert('最大支持4个选项')
    } else if (voteOptionNum == 0) {
      voteOptionNum = 2
    } else {
      voteOptionNum++
    }
    this.setState({ voteOptionNum })
  }

  render() {
    const { vote } = this.state
    let replyClassName =
      'reply-form box' + (this.state.text ? ' reply-sticky' : '');
    return (
      <form
        onSubmit={this.on_submit.bind(this)}
        className={
          this.props.action === 'dopost' ? 'post-form box' : replyClassName
        }
      >
        <div className="post-form-bar">
          <label>
            {/*<a>上传图片</a>*/}
            <span className={'post-upload'}>
              <span className="icon icon-image" />
              &nbsp;插入图片
            </span>
            <input
              ref={this.img_ref}
              type="file"
              accept="image/*"
              disabled={this.state.loading_status !== 'done'}
              onChange={this.on_img_change_bound}
            />
          </label>
          {/* 发起投票，不可在评论区发送投票*/}
          {this.props.action==='dopost' ? (
            !vote ?(
              <button
                type="button"
                onClick={() => { this.setState({vote:true,voteOptionNum:2}); }}
              >
                <span className="icon icon-how_to_vote" />
                &nbsp;投票
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => { this.addVote() }}
              >
                <span className="icon icon-how_to_vote" />
                &nbsp;添加
              </button>
            )
          ):(<div></div>)
          }
          {this.state.preview ? (
            <button
              type="button"
              onClick={() => {
                this.toggle_preview();
              }}
            >
              <span className="icon icon-eye-blocked" />
              &nbsp;编辑
            </button>
          ) : (
            <button
            type="button"
            onClick={() => {
              this.toggle_preview();
            }}>
              <span className="icon icon-eye" />
            &nbsp;预览
            </button>
            )}
          {this.state.loading_status !== 'done' ? (
            <button disabled="disabled">
              <span className="icon icon-loading" />
              &nbsp;
              {this.state.loading_status === 'processing' ? '处理' : '上传'}
            </button>
          ) : (
            <button type="submit">
              <span className="icon icon-send" />
              &nbsp;发表
            </button>
          )}
        </div>
        {!!this.state.img_tip && (
          <p className="post-form-img-tip">
            <a
              onClick={() => {
                this.img_ref.current.value = '';
                this.on_img_change();
              }}
            >
              删除图片
            </a>
            {this.state.img_tip}
          </p>
        )}
        {this.state.preview ? (
          <div
            className={
              this.props.action === 'dopost' ? 'post-preview' : 'reply-preview'
            }
          >
            <HighlightedMarkdown
              text={this.state.text}
              color_picker={this.color_picker}
              show_pid={() => { }}
            />
          </div>
        ) : (
          <SafeTextarea
            ref={this.area_ref}
            id={this.props.pid}
            on_change={this.on_change_bound}
            on_submit={this.on_submit.bind(this)}
          />
          )}
        {this.state.voteOptionNum !== 0 && (
          <VoteEditBox 
            num={this.state.voteOptionNum} 
            sendVoteData={(voteDataObj)=>{
              let preVoteData=this.state.voteData; 
              Object.assign(preVoteData,voteDataObj);
              this.setState({voteData:preVoteData});}}
          />
        )}
        {this.props.action === 'dopost' && (
          <p>
            <small>
              发帖前请阅读并同意
              <a href={process.env.REACT_APP_RULES_URL} target="_blank">
                树洞规范
              </a>
            </small>
          </p>
        )}
      </form>
    );
  }
}
