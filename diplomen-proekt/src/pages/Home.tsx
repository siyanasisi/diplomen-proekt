import { HomeView } from "../components/home/HomeView";
import { useHome } from "../hooks/useHome";

export const Home = () => {
    const home = useHome();
    return <HomeView home={home} />;
};
