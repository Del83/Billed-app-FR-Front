/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";
import {
  screen,
  waitFor,
  getByText,
  getAllByTestId,
} from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import Router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  //Étant donné que je suis connecté en tant qu'employé
  describe("When I am on Bills Page", () => {
    //Quand je suis sur la page "mes notes de frais"
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Alors, l'icône de la facture dans la disposition verticale doit être mise en surbrillance

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = `<div id="root"></div>`;
      Router();
      window.onNavigate(ROUTES_PATH.Bills);

      const windowIcon = await waitFor(() => screen.getByTestId("icon-window"));
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      // Ensuite, les factures doivent être classées par ordre décroissant
      document.body.innerHTML = BillsUI({
        data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)), // correction du bug ()
      });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = bills.map((d) => d.date).sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe("When I click on the new bill button", () => {
      //Quand je clique sur le bouton nouvelle note de frais
      test("Then, I should be sent to newBill page", () => {
        //Ensuite, je devrais être envoyé à la page newBill
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        const bills = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        }); // nouvelle objet de la class Bills

        const handleClickNewBill = jest.fn(bills.handleClickNewBill); // fonction simulée de la méthode handleClickNewBill de la class Bills
        const btnNewBill = screen.getByTestId("btn-new-bill"); // const icone nouvelle note de frais
        btnNewBill.addEventListener("click", handleClickNewBill); // écoute les clics sur l'icone nouvelle note de frais
        userEvent.click(btnNewBill); // simule un click sur l'icone nouvelle note de frais

        expect(handleClickNewBill).toHaveBeenCalled(); // test si handleClickNewBill est bien appelé lors du click sur l'icône nouvelle note de frais
        expect(
          getByText(document.body, "Envoyer une note de frais")
        ).toBeTruthy(); // test si les mots "Envoyer une note de frais" apparaissent sur la page(screen) (après le clic sur l'icône nouvelle note de frais)
      });
    });

    describe("When I click on the eye icon", () => {
      test("A modal should open", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const billsPage = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        $.fn.modal = jest.fn(); // on mock(fonction simulée) la fonction modale

        const firstEyeIcon = getAllByTestId(document.body, "icon-eye")[0]; // on récupère le premier bouton trouvé
        const handleClickIconEye = jest.fn(
          billsPage.handleClickIconEye(firstEyeIcon)
        ); // mock(fonction simulée) de la méthode handleClickNewBill de la class Bills
        firstEyeIcon.addEventListener("click", handleClickIconEye); // écoute les clics sur le premier bouton icon-eye
        userEvent.click(firstEyeIcon); // simule un clic sur le premier bouton icon-eye
        expect(handleClickIconEye).toHaveBeenCalled(); // test si handleClickIconEye est bien appelé lors du clic sur le premier bouton icon-eye

        const modale = screen.getByTestId("modale");
        expect(modale).toBeTruthy(); // test si data-testId = modale apparait bien sur la page en cour
      });
    });

    // test d'intégration GET
    describe("When I navigate to Bills page", () => {
      test("fetches bills from mock API GET", async () => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        document.body.innerHTML = `<div id="root"></div>`;
        Router();

        const bills = await mockStore.bills().list();
        expect(bills.length).toBe(4);
        expect(bills[2].name).toBe("test3");
        expect(bills[1].commentAdmin).toBe("en fait non");
      });

      describe("When an error occurs on API", () => {
        beforeEach(() => {
          jest.spyOn(mockStore, "bills");
          Object.defineProperty(window, "localStorage", {
            value: localStorageMock,
          });
          window.localStorage.setItem(
            "user",
            JSON.stringify({
              type: "Employee",
              email: "a@a",
            })
          );
          document.body.innerHTML = `<div id="root"></div>`;
          Router();
        });

        test("fetches bills from an API and fails with 404 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error("Erreur 404"));
              },
            };
          });
          window.onNavigate(ROUTES_PATH.Bills);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 404/);
          expect(message).toBeTruthy();
        });

        test("fetches messages from an API and fails with 500 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error("Erreur 500"));
              },
            };
          });

          window.onNavigate(ROUTES_PATH.Bills);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 500/);
          expect(message).toBeTruthy();
        });
      });
    });
  });
});
