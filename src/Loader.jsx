import loadingSvg from './assets/loading.svg';

export default function Loader() {
    return (
        <div className='loading-container'>
          <img src={loadingSvg} alt="loading" />  
        </div>
      );
}