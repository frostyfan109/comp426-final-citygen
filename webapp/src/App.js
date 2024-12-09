import { ConfigProvider, Spin } from 'antd';
import { red, volcano, gray } from '@ant-design/colors'
import { Router, LocationProvider, Redirect } from '@gatsbyjs/reach-router'
import { ErrorPage, MainMenu, MapSelect, MapCreate, LoginPage, AccountPage, GamePage, CreditsPage } from './views'
import { ProtectedRoute } from './components/protected-route'
import { APIProvider } from './contexts'
import './App.css'

function App() {
  return (
    <div className="App">
      <ConfigProvider
        theme={{
          token: {
            fontFamily: "VCR",
            colorPrimary: red[6],
            colorTextBase: "white",
            colorPrimaryActive: volcano.primary
          },
          components: {
            Menu: {
              itemBg: "rgba(255, 255, 255, 0.05)",
              itemActiveBg: "rgba(255, 255, 255, 0.2)",
              itemMarginBlock: 8,
              itemMarginInline: 0
            },
            Modal: {
              contentBg: "rgb(24, 24, 24)",
              headerBg: "rgb(24, 24, 24)",
              footerBg: "rgb(24, 24, 24)"
            },
            Segmented: {
              trackBg: "transparent",
              itemSelectedBg: "transparent",
              itemActiveBg: "rgba(255, 255, 255, 0.15)",
            },
            Message: {
              contentBg: "rgb(24, 24, 24)"
            }
          }
        }}
      >
        <LocationProvider>
          <APIProvider>
              <Router style={{ width: "100%" }}>
                <ProtectedRoute component={ MainMenu } path="/" />
                <ProtectedRoute component={ MapSelect } path="/select-map" />
                <ProtectedRoute component={ MapCreate } path="/create-map" />
                <ProtectedRoute component={ AccountPage } path="/account" />
                <ProtectedRoute component={ GamePage } path="/play/:mapId" />
                <ProtectedRoute component={ CreditsPage } path="/attributions" />
                <ProtectedRoute component={ LoginPage } onlyRequireLoading path="/login" />
                <ProtectedRoute component={ LoginPage } register onlyRequireLoading path="/register" />
                <ErrorPage code={ 404 } default />
                <Redirect from="/play" to="/select-map" noThrow />
              </Router>
          </APIProvider>
        </LocationProvider>
      </ConfigProvider>
    </div>
  );
}

export default App;
