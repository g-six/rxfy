const formReducer = (
  state = {
    form_1: false,
    form_2: false,
    confirmation: false,
  },
  action: {
    type:
      | 'HIDE_FORM_1'
      | 'HIDE_FORM_2'
      | 'SHOW_FORM_1'
      | 'SHOW_FORM_2'
      | 'SHOW_CONFIRMATION';
  }
) => {
  switch (action.type) {
    case 'HIDE_FORM_1':
      return {
        ...state,
        form_1: false,
      };
    case 'HIDE_FORM_2':
      return {
        ...state,
        form_2: false,
      };
    case 'SHOW_CONFIRMATION':
      return {
        ...state,
        confirmation: true,
      };
    default:
      return state;
  }
};

export default formReducer;
