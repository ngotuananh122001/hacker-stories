import { useCallback, useEffect, useReducer, useState } from "react";

const useSemiPersistentState = (key, initialState) => {
  const [value, setValue] = useState(localStorage.getItem(key) || initialState);

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const storiesReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STORIES':
      return action.payload;
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(story => story.objectID !== action.payload.objectID)
      }
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        data: action.payload,
        isLoading: false,
        isError: false
      };
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      }
    default:
      return state;
  }
};

function App() {
  const [stories, dispatchStories] = useReducer(storiesReducer, {
    data: [],
    isLoading: false,
    isError: false,
  });

  const [searchTerm, setSearchTerm] = useSemiPersistentState("search", "React");

  const handleFetchStories = useCallback(() => {
    if (!searchTerm) return;
    dispatchStories({ type: "STORIES_FETCH_INIT" });

    fetch(`${API_ENDPOINT}${searchTerm}`)
      .then((response) => response.json())
      .then((result) => {
        dispatchStories({ type: "STORIES_FETCH_SUCCESS", payload: result.hits })
      })
      .catch((error) => {
        console.log(error);
        dispatchStories({ type: "STORIES_FETCH_FAILURE" });
      });
  }, [searchTerm]);

  console.log('handleFetchStories', handleFetchStories);

  useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);


  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    localStorage.setItem("search", event.target.value);
  };


  const handleRemoveItem = (item) => {
    // console.log('handleRemoveItem', item);
    // console.log(stories);
    // return true;
    dispatchStories({ type: "REMOVE_STORY", payload: item });
  };

  return (
    <div>
      <h1>My Hacker Stories</h1>

      <InputWithLabel
        id="search"
        value={searchTerm}
        onInputChange={handleSearch}
      >
        <strong>Search:</strong>
      </InputWithLabel>

      <hr />

      {stories.isError && <p>Something went wrong</p>}
      {stories.isLoading ? (
        <p>Loading...</p>
      ) : (
        <List list={stories.data} onRemoveItem={handleRemoveItem} />
      )}
    </div>
  );
}

const InputWithLabel = ({
  id,
  type = "text",
  value,
  onInputChange,
  children,
}) => (
  <>
    <label htmlFor={id}>{children}</label>
    &nbsp;
    <input type={type} id={id} value={value} onChange={onInputChange} />
  </>
);

const List = ({ list, onRemoveItem }) =>
  list.map((item) => (
    <Item key={item.objectID} item={item} onRemoveItem={onRemoveItem} />
  ));

const Item = ({ item, onRemoveItem }) => (
  <div>
    <span>
      <a href={item.url}>{item.title}</a>
    </span>
    <span>{item.author}</span>
    <span>{item.num_comments}</span>
    <span>{item.points}</span>
    <span>
      <button type="button" onClick={() => onRemoveItem(item)}>
        Dismiss
      </button>
    </span>
  </div>
);

export default App;
