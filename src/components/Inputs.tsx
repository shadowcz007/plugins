import React, { useState } from 'react';
import { Input, List, Image, Button, Progress, Typography, Card, Divider } from 'antd';

import { CloseOutlined, LoadingOutlined, PlayCircleOutlined } from '@ant-design/icons';
import Draggable from 'react-draggable';
import i18n from "i18next";

import InputBlock from './InputBlock'
import InputTag from './InputTag'
import InputCascader from './InputCascader'

import { savePosition, getPosition, onCardFocus } from './Common'

const { Text } = Typography

type PropType = {
  [propName: string]: any;
}

type StateType = {
  [stateName: string]: any;
}

interface App {
  state: StateType;
  props: PropType
}

declare const window: Window &
  typeof globalThis & {
    electron: any,
  }




class App extends React.Component {
  _defaultPosition: any;
  constructor(props: any) {
    super(props);

    this.state = this._init()

  }

  _init() {
    const name = this.props.data?.name,
      id = this.props.data?.id;

    this._defaultPosition = getPosition(`_${name}_inputs_position`);

    return {
      name, id,
      data: this.props.data?.data,
      Running: [],
      Pending: [],
      isLoading: false,
      serverStatus: 0,
      progress: 101,
      executionStart: false
    }
  }

  _savePosition(e: any) {
    savePosition(`_${this.state.name}_inputs_position`, e);
  }

  _updateData(id: string, value: any) {
    let newData = Array.from(this.state.data, (d: any) => {
      if (d.id === id) {
        d.value = value;
      }
      return d
    })
    this.setState({
      data: newData
    })
  }

  componentDidMount() {
    // this.setupConnection();
    onCardFocus(`_${this.state.name}_inputs_position`);
    window.electron.comfyApi('getQueue').then((res: any) => {
      const { Running, Pending } = res;
      this.setState({ Running, Pending })
    });

    window.addEventListener('message', async (res: any) => {
      const { cmd, data } = res.data;
      const { event, data: d2 } = data;

      console.log('##inputs', data)

      if (cmd === 'status:done') {
        if (data.id === this.state.id) {
          this.setState({
            isLoading: false
          })
        }
      }

      if (event === 'execution_start') {
        // prompt_id
        let prompt_id = d2.prompt_id;
        console.log('#execution_start', prompt_id)
        if (!prompt_id) return
        const workflow = JSON.parse(localStorage.getItem('_plugin_current_workflow') || '{}')

        // 判断是否任务id是否匹配

        this.setState({
          executionStart: workflow.prompt_id == prompt_id,
          isLoading: workflow.prompt_id == prompt_id,
        })

        if (workflow.prompt_id !== prompt_id) {
          // getQueue

          const queue = await window.electron.comfyApi('getQueue');
          const { Running, Pending } = queue;
          console.log('#queue', Running, Pending)

        }

      }

      if (event === 'status') {
        // 是否连接了服务器
        if (d2) {
          // 正常
          this.setState({
            serverStatus: 0
          })
        } else {
          // 服务不可用
          this.setState({
            serverStatus: 1
          })
        }
      }

      if (event === 'progress') {
        const { value, max } = d2;

        this.setState({
          progress: 100 * value / max
        })

      }

    })

  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (this.props.data != prevProps.data) {
      const d: any = this._init()
      this.setState(d);
    }
  }

  componentWillUnmount() {
  }

  render() {

    return (
      <Draggable handle="strong"
        defaultClassName={`react-draggable _${this.state.name}_inputs_position`}
        defaultPosition={this._defaultPosition}
        onDrag={(e) => this._savePosition(e)}
        onStop={(e) => this._savePosition(e)}
        onMouseDown={() => onCardFocus(`_${this.state.name}_inputs_position`)}
      >
        <Card
          title={<strong className="cursor">
            <p>{this.state.name}</p>
            <p>{'#inputs'}</p>
          </strong>}
          bordered={false}
          style={{
            width: 480,
            position: 'fixed',
            // left: 120, top: '10vh', 
            // height: '80vh' 
          }}
          bodyStyle={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            alignItems: 'center'
          }}
          extra={<CloseOutlined key="edit"
            onClick={async () => {
              window.postMessage({
                data: {
                  event: 'close-input',
                  data: {
                    name
                  }
                }
              })
            }}
          />}
        // actions={actions}
        >

          {
            <>
              {/* <>{this.state.id}</>
               */}
              {this.state.progress <= 100 && <Progress steps={5} percent={this.state.progress} />}
              {/* <Divider /> */}
            </>
          }

          {
            this.state.data?.length > 0 && (() => {
              let div = [];
              for (const item of this.state.data) {
                let cascader: any = "";
                if (item.cascader) {
                  // true
                  cascader = <InputCascader
                    onChange={(e: any) => {
                      console.log(e)
                      let newItemValue;
                      Array.from(this.state.data, (d: any) => {
                        if (d.id === item.id) {
                          if (typeof (d.value) === 'string') {
                            d.value += ',' + e.currentTarget.value.join(',')
                          } else if (Array.isArray(d.value)) {
                            for (const v of e.currentTarget.value) {
                              if (!d.value.includes(v)) {
                                d.value.push(v)
                              }
                            }
                            // d.value = [...d.value, ...e.currentTarget.value]
                          }
                          newItemValue = d.value;
                        }
                        return d
                      })

                      if (newItemValue) this._updateData(item.id, newItemValue)
                    }}
                  />
                }

                if (item.type === 'string') {
                  div.push(<>
                    <div style={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: 'space-between',
                      margin: '12px 0'
                    }}>
                      <Text style={{ marginBottom: 12 }}>{item.label} </Text>
                      {cascader}
                    </div>
                    <Input.TextArea rows={4}
                      value={item.value}
                      className='scrollbar'
                      style={{ marginBottom: 12 }}
                      onChange={(e: any) => {
                        this._updateData(item.id, e.currentTarget.value);
                      }}
                    />
                    <Divider />
                  </>)
                };

                if (item.type === 'tag') {
                  div.push(<>
                    <div style={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: 'space-between',
                      margin: '12px 0'
                    }}>
                      <Text style={{ marginBottom: 12 }}>{item.label} </Text>
                      {cascader}
                    </div>
                    <InputTag
                      value={item.value}
                      style={{ marginBottom: 12 }}
                      onChange={(e: any) => {
                        this._updateData(item.id, e.currentTarget.value);
                      }}
                    />
                    <Divider />
                  </>)
                }


                if (item.type === 'block') {
                  div.push(<>
                    <div style={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: 'space-between',
                      margin: '12px 0'
                    }}>
                      <Text style={{ marginBottom: 12 }}>{item.label} </Text>
                      {cascader}
                    </div>
                    <InputBlock
                      value={item.value}
                      style={{ marginBottom: 12 }}
                      onChange={(e: any) => {
                        this._updateData(item.id, e.currentTarget.value);
                      }}
                    />
                    <Divider />
                  </>)
                }


              }
              return div
            })()
          }

          <Button
            type="primary"
            disabled={this.state.isLoading}
            onClick={() => {
              // console.log('###', this.state.data)
              if (this.props.callback) {
                this.props.callback({
                  cmd: 'runPrompt',
                  data: {
                    name: this.state.name, data: this.state.data
                  }
                })
              }
              this.setState({
                isLoading: true
              })
            }}>{this.state.isLoading ? <LoadingOutlined /> : i18n.t('runPrompt')}</Button>
        </Card>

      </Draggable>
    );
  }
}

export default App