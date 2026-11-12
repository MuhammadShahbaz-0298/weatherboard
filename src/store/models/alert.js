const alert = {
  state: {
    message: '',
    type: 'info',
    id: 0,
    success: '',
    error: ''
  },
  reducers: {
    setMessage(state, payload) {
      return { ...state, message: payload };
    },
    setType(state, payload) {
      return { ...state, type: payload };
    },
    setId(state, payload) {
      return { ...state, id: payload };
    },
    setSuccess(state, payload) {
      return { ...state, success: payload };
    },
    setError(state, payload) {
      return { ...state, error: payload };
    }
  },
  effects: (dispatch) => {
    return {
      success(payload) {
        this.show({ type: 'success', message: payload && payload.msg });
      },
      error(payload) {
        this.show({ type: 'error', message: payload && payload.msg });
      },
      info(payload) {
        this.show({ type: 'info', message: payload && payload.msg });
      },
      show(payload) {
        const type = payload && typeof payload.type === 'string' ? payload.type : 'info';
        const text = payload && typeof payload.message === 'string' ? payload.message : '';
        this.setType(type);
        this.setMessage(text);
        this.setId(Date.now());
        this.setSuccess(type === 'success' ? text : '');
        this.setError(type === 'error' ? text : '');
      },
      clear() {
        this.setType('info');
        this.setMessage('');
        this.setId(0);
        this.setSuccess('');
        this.setError('');
      },
      resetMessages() {
        this.setSuccess('');
        this.setError('');
      }
    };
  }
};

export default alert;
