const formReducer = (
  state = {},
  action: {
    type: 'UPDATE_VALUE' | 'RESET_VALUE';
    key: string;
    value?: number | string | boolean | { [k: string]: number | string | string[] | boolean };
  },
) => {
  switch (action.type) {
    case 'UPDATE_VALUE':
      return {
        ...state,
        [action.key]: action.value,
      };
    case 'RESET_VALUE':
      return action.value;
    default:
      return state;
  }
};

export default formReducer;
