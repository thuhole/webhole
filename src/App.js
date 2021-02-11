import React, { Component } from 'react';
import { Flow } from './Flows';
import { Title } from './Title';
import { Sidebar } from './Sidebar';
import { SwitchTransition, CSSTransition } from 'react-transition-group';
import { PressureHelper } from './PressureHelper';
import { TokenCtx } from './UserAction';
import { load_config, bgimg_style } from './Config';
import { listen_darkmode } from './old_infrastructure/functions';
import { TitleLine } from './old_infrastructure/widgets';
import { LoginPopup } from './login';
import { cache } from './cache';
import './App.css';

const MAX_SIDEBAR_STACK_SIZE = 10;

function DeprecatedAlert(props) {
  return <div id="global-hint-container" style={{ display: 'none' }} />;
}

function needShowSuicidePrompt(text) {
  return text && text.indexOf('自杀') !== -1;
}

class App extends Component {
  constructor(props) {
    super(props);
    load_config();
    listen_darkmode(
      { default: undefined, light: false, dark: true }[
        window.config.color_scheme
      ],
    );
    this.state = {
      sidebar_stack: [[null, null]], // list of [status, content]
      mode: 'list', // list, single, search, attention
      search_text: null,
      flow_render_key: +new Date(),
      token: localStorage['TOKEN'] || null,
      override_suicide: false,
    };
    this.show_sidebar_bound = this.show_sidebar.bind(this);
    this.set_mode_bound = this.set_mode.bind(this);
    this.on_pressure_bound = this.on_pressure.bind(this);
    // a silly self-deceptive approach to ban guests, enough to fool those muggles
    //                     document             cookie                    'pku_ip_flag=yes'
    this.inthu_flag =
      window[atob('ZG9jdW1lbnQ')][atob('Y29va2ll')].indexOf(
        atob('dGh1X2lwX2ZsYWc9eWVz'),
      ) !== -1;
  }

  static is_darkmode() {
    if (window.config.color_scheme === 'dark') return true;
    if (window.config.color_scheme === 'light') return false;
    else {
      // 'default'
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }
  componentDidMount() {
    cache(); // init indexeddb
  }

  on_pressure() {
    if (this.state.sidebar_stack.length > 1)
      this.show_sidebar(null, null, 'clear');
    else this.set_mode('list', null);
  }

  show_sidebar(title, content, mode = 'push') {
    this.setState((prevState) => {
      let ns = prevState.sidebar_stack.slice();
      if (mode === 'push') {
        if (ns.length === 1) {
          document.body.style.top = `-${window.scrollY}px`;
          document.body.style.position = 'fixed';
          document.body.style.width = '100vw'; // Be responsive with fixed position
        }
        if (ns.length > MAX_SIDEBAR_STACK_SIZE) ns.splice(1, 1);
        ns = ns.concat([[title, content]]);
      } else if (mode === 'pop') {
        if (ns.length === 1) return;
        if (ns.length === 2) {
          const scrollY = document.body.style.top;
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
        ns.pop();
      } else if (mode === 'replace') {
        ns.pop();
        ns = ns.concat([[title, content]]);
      } else if (mode === 'clear') {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
        ns = [[null, null]];
      } else throw new Error('bad show_sidebar mode');
      return {
        sidebar_stack: ns,
      };
    });
  }

  set_mode(mode, search_text) {
    this.setState({
      mode: mode,
      search_text: search_text,
      flow_render_key: +new Date(),
    });
  }

  render() {
    return (
      <TokenCtx.Provider
        value={{
          value: this.state.token,
          set_value: (x) => {
            localStorage['TOKEN'] = x || '';
            this.setState({
              token: x,
            });
          },
        }}
      >
        <PressureHelper callback={this.on_pressure_bound} />
        <div className="bg-img" style={bgimg_style()} />
        <Title
          show_sidebar={this.show_sidebar_bound}
          set_mode={this.set_mode_bound}
          mode={this.state.mode}
        />
        <TokenCtx.Consumer>
          {(token) => (
            <div className="left-container">
              <DeprecatedAlert token={token.value} />
              {!token.value && (
                <div className="flow-item-row aux-margin">
                  <div className="box box-tip">
                    <p>
                      <LoginPopup token_callback={token.set_value}>
                        {(do_popup) => (
                          <a onClick={do_popup}>
                            <span className="icon icon-login" />
                            &nbsp;登录到 {process.env.REACT_APP_TITLE}
                          </a>
                        )}
                      </LoginPopup>
                    </p>
                  </div>
                </div>
              )}
              {needShowSuicidePrompt(this.state.search_text) &&
                !this.state.override_suicide && (
                  <div className="flow-item-row">
                    <div className="flow-item box box-tip">
                      <p style={{ textAlign: 'left' }}>需要帮助？</p>
                      <p style={{ textAlign: 'left' }}>
                        北京24小时心理援助热线：
                        <a href="tel:01082951332">010-8295-1332</a>
                      </p>
                      <p style={{ textAlign: 'left' }}>
                        希望24小时热线：
                        <a href="tel:4001619995">400-161-9995</a>
                      </p>
                      <hr />
                      <p>
                        <button
                          onClick={() => {
                            window.location.href =
                              'https://www.zhihu.com/question/25082178/answer/106073121';
                          }}
                        >
                          了解更多
                        </button>
                        &nbsp; &nbsp; &nbsp;
                        <button
                          onClick={() => {
                            this.setState({
                              override_suicide: true,
                            });
                          }}
                        >
                          展示结果
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              {this.inthu_flag || token.value ? (
                (this.state.override_suicide ||
                  !needShowSuicidePrompt(this.state.search_text)) && (
                    <SwitchTransition mode="out-in">
                      <CSSTransition
                        key={this.state.flow_render_key}
                        timeout={100}
                        classNames="flows-anim"
                      >
                        <Flow
                          key={this.state.flow_render_key}
                          show_sidebar={this.show_sidebar_bound}
                          mode={this.state.mode}
                          search_text={this.state.search_text}
                          token={token.value}
                        />
                      </CSSTransition>
                    </SwitchTransition>
                )
              ) : (
                <TitleLine text="请登录后查看内容" />
              )}
              <br />
            </div>
          )}
        </TokenCtx.Consumer>
        <Sidebar
          show_sidebar={this.show_sidebar_bound}
          stack={this.state.sidebar_stack}
        />
      </TokenCtx.Provider>
    );
  }
}

export default App;
