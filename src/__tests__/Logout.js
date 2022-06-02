/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/dom";
import Logout from "../containers/Logout.js";
import DashboardUI from "../views/DashboardUI.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES } from "../constants/routes";

const bills = [
  {
    id: "47qAXb6fIm2zOKkLzMro",
    vat: "80",
    fileUrl:
      "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
    status: "pending",
    type: "Hôtel et logement",
    commentary: "séminaire billed",
    name: "encore",
    fileName: "preview-facture-free-201801-pdf-1.jpg",
    date: "2004-04-04",
    amount: 400,
    commentAdmin: "ok",
    email: "a@a",
    pct: 20,
  },
];

describe("Given I am connected", () => {
  //Étant donné que je suis connecté
  describe("When I click on disconnect button", () => {
    //Quand je clique sur le bouton de déconnexion
    test("Then, I should be sent to login page", () => {
      //Ensuite, je devrais être envoyé à la page de connexion
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Admin",
        })
      );
      document.body.innerHTML = DashboardUI({ bills });
      const logout = new Logout({ document, onNavigate, localStorage }); // nouvelle objet de la class Logout
      const handleClick = jest.fn(logout.handleClick); // fonction simulée de la méthode handleClick de la class Logout

      const disco = screen.getByTestId("layout-disconnect"); // const icone déconnexion
      disco.addEventListener("click", handleClick); // écoute les clics sur l'icone déconnexion
      userEvent.click(disco); // simule un click sur l'icone déconnexion

      expect(handleClick).toHaveBeenCalled(); // test si handleClick est bien appelé lors du click sur icône déconnexion
      expect(screen.getByText("Administration")).toBeTruthy(); // test si le mot Administration apparait sur la page(screen) (après le clic sur déconnexion)
    });
  });
});
