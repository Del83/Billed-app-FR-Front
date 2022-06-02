import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { screen, fireEvent, getByTestId, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import Router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      Object.defineProperty(window, "location", {
        // remplace : window.onNavigate(ROUTES_PATH.NewBill);
        value: { hash: ROUTES_PATH["NewBill"] },
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = `<div id="root"></div>`;
      Router();
    });

    test("Then mail icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId("icon-mail"));
      const windowIcon = screen.getByTestId("icon-mail");
      expect(windowIcon).toHaveClass("active-icon");
    });

    /* test("Then there are a form to edit new bill", () => {
       const html = NewBillUI({});
       document.body.innerHTML = html;
       const contentTitle = screen.getAllByText("Envoyer une note de frais");
       expect(contentTitle).toBeTruthy;
     }); */
  });

  describe("When I am on NewBill Page and I choose an file to upload ", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      Object.defineProperty(window, "location", {
        // remplace : window.onNavigate(ROUTES_PATH.NewBill);
        value: { hash: ROUTES_PATH["NewBill"] },
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
    });
    test("Then I choose a wrong format of file and an error message is displayed", async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["document.txt"], "document.txt", {
              type: "document/txt",
            }),
          ],
        },
      });

      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
      expect(handleChangeFile).toBeCalled();
      expect(inputFile.files[0].name).toBe("document.txt");
      await waitFor(() =>
        screen.getByText("Ce format de fichier n'est pas accepté")
      );
      await waitFor(() => getByTestId(document.body, "message"));
      expect(getByTestId(document.body, "message").classList).not.toContain(
        "hidden"
      );
      expect(
        screen.getByText("Ce format de fichier n'est pas accepté")
      ).toBeTruthy();
    });

    test("Then i can choose file with good extension (jpg|jpeg|png)", async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const inputFile = screen.getByTestId("file");
      const img = new File(["img"], "image.png", { type: "image/png" });

      inputFile.addEventListener("change", handleChangeFile);
      await waitFor(() => {
        userEvent.upload(inputFile, img);
      });

      expect(inputFile.files[0].name).toBe("image.png");
      expect(handleChangeFile).toBeCalled();
      expect(newBill.handleChangeFile).toBeTruthy();
    });

    test("Then i can choose file but there are an error server 500", async () => {
      jest.spyOn(mockStore, "bills");
      jest.spyOn(console, "error").mockImplementation(() => {}); // Prevent Console.error jest error

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: jest.fn().mockResolvedValueOnce(false),
        };
      });

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: null,
      });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const inputFile = screen.getByTestId("file");
      const img = new File(["img"], "image.png", { type: "image/png" });
      let validFile;

      inputFile.addEventListener("change", (e) => {
        validFile = handleChangeFile(e);
      });
      await waitFor(() => {
        userEvent.upload(inputFile, img);
      });
      expect(inputFile.files[0].name).toBe("image.png");
      expect(handleChangeFile).toBeCalled();
      expect(validFile).not.toBeTruthy();
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });

  // test d'intégration
  describe("Given I am connected as an employee", () => {
    describe("When I do fill fields in incorrect format or do not fill fields and I click on submit button", () => {
      test("Then my inputs should be invalid", async () => {
        document.body.innerHTML = NewBillUI();

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Get DOMElements
        const inputType = screen.getByTestId("expense-type");
        const inputName = screen.getByTestId("expense-name");
        const inputDate = screen.getByTestId("datepicker");
        const inputAmount = screen.getByTestId("amount");
        const inputVAT = screen.getByTestId("vat");
        const inputPCT = screen.getByTestId("pct");
        const inputComment = screen.getByTestId("commentary");
        const inputFile = screen.getByTestId("file");
        const form = screen.getByTestId("form-new-bill");

        // Input datas
        const formData = {
          type: "Transports",
          name: "nom",
          date: "",
          amount: "-31",
          vat: 34,
          pct: "",
          file: new File(["img"], "test.jpg", { type: "image/jpg" }),
          commentary: "commentaire",
        };

        // Edit input
        fireEvent.change(inputType, { target: { value: formData.type } });
        fireEvent.change(inputName, { target: { value: formData.name } });
        fireEvent.change(inputDate, { target: { value: formData.date } });
        fireEvent.change(inputAmount, { target: { value: formData.amount } });
        fireEvent.change(inputVAT, { target: { value: formData.vat } });
        fireEvent.change(inputPCT, { target: { value: formData.pct } });
        fireEvent.change(inputComment, {
          target: { value: formData.commentary },
        });
        userEvent.upload(inputFile, formData.file);

        // Submit form
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        // Check if submit function called
        expect(handleSubmit).toHaveBeenCalled();

        // Verify if inputs are invalid
        expect(inputDate.validity.valid).not.toBeTruthy();
        expect(inputAmount.validity.valid).toBeTruthy();
        expect(inputPCT.validity.valid).not.toBeTruthy();
      });
    });
    describe("When I do fill fields in correct format and I click on submit button", () => {
      test("Then I should post new Bill ticket", async () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        Object.defineProperty(window, "location", {
          value: { hash: ROUTES_PATH["NewBill"] },
        });

        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );
        document.body.innerHTML = `<div id="root"></div>`;
        Router();

        // we have to mock navigation to test it
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        //document.body.innerHTML = NewBillUI();

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Define inputs values
        const inputData = {
          type: "Transports",
          name: "Vol Toulouse Corse",
          amount: "174",
          date: "2022-02-22",
          vat: 70,
          pct: 20,
          file: new File(["img"], "image.png", { type: "image/png" }),
          commentary: "Note de deplacement professionnel",
          status: "pending",
        };

        // Get Inputs HTMLElement
        const inputType = screen.getByTestId("expense-type");
        const inputName = screen.getByTestId("expense-name");
        const inputDate = screen.getByTestId("datepicker");
        const inputAmmount = screen.getByTestId("amount");
        const inputVat = screen.getByTestId("vat");
        const inputPct = screen.getByTestId("pct");
        const inputComment = screen.getByTestId("commentary");
        const inputFile = screen.getByTestId("file");
        const form = screen.getByTestId("form-new-bill");

        // Edit input HTML
        fireEvent.change(inputType, { target: { value: inputData.type } });
        fireEvent.change(inputName, { target: { value: inputData.name } });
        fireEvent.change(inputDate, { target: { value: inputData.date } });
        fireEvent.change(inputAmmount, { target: { value: inputData.amount } });
        fireEvent.change(inputVat, { target: { value: inputData.vat } });
        fireEvent.change(inputPct, { target: { value: inputData.pct } });
        fireEvent.change(inputComment, {
          target: { value: inputData.commentary },
        });

        // Submit form
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);

        await waitFor(() => {
          userEvent.upload(inputFile, inputData.file);
        });
        fireEvent.submit(form);

        /* // check function called
         expect(handleSubmit).toHaveBeenCalled();
 
         // Verify input validity
         expect(inputType.validity.valid).toBeTruthy();
         expect(inputName.validity.valid).toBeTruthy();
         expect(inputDate.validity.valid).toBeTruthy();
         expect(inputAmmount.validity.valid).toBeTruthy();
         expect(inputVat.validity.valid).toBeTruthy();
         expect(inputPct.validity.valid).toBeTruthy();
         expect(inputComment.validity.valid).toBeTruthy();
         expect(inputFile.files[0]).toBeDefined(); */
      });

      test("Then it should be render Bills Page", () => {
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      });

      test("Then newBill should be created", async () => {
        // we have to use mockStore to simulate bill creation

        const updateBill = mockStore.bills().update();
        const addedBill = await updateBill.then((value) => {
          return value;
        });

        expect(addedBill.id).toEqual("47qAXb6fIm2zOKkLzMro");
        expect(addedBill.amount).toEqual(400);
        expect(addedBill.fileUrl).toEqual(
          "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a"
        );
      });
    });
  });
});

/////////////////

/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import Router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    document.body.innerHTML = `<div id="root"></div>`;
    Router();
  });

  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      const windowIcon = screen.getByTestId("icon-mail");
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
  });

  describe("When I am on NewBill Page and I upload file with good extension (jpg|jpeg|png)", () => {
    test("Then my input file should be added", async () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Edit Input File
      const input = screen.getByTestId("file");
      const file = new File(["img"], "image.png", { type: "image/png" });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      input.addEventListener("change", handleChangeFile);
      userEvent.upload(input, file);

      expect(handleChangeFile).toHaveBeenCalled();
      expect(input.files[0].name).toBe("image.png");
      expect(input.files[0].name).toMatch(/(\.jpg|\.jpeg|\.png)$/i);
      expect(newBill.handleChangeFile).toBeTruthy();
    });
    test("Then bill file should be created", async () => {
      // we have to use mockStore to simulate add of bill image
      const billImageAdd = mockStore.bills().create();
      const addedImage = await billImageAdd.then((value) => {
        return value;
      });

      expect(addedImage.fileUrl).toEqual(
        "https://localhost:3456/images/test.jpg"
      );
      expect(addedImage.key).toEqual("1234");
    });
  });

  describe("When I am on NewBill Page and I upload file with incorect format", () => {
    test("Then my input file should be invalid", async () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Edit Input File
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const input = screen.getByTestId("file");
      const file = new File(["video"], "bill.mp4", { type: "video/mp4" });
      input.addEventListener("change", handleChangeFile);
      userEvent.upload(input, file);

      expect(handleChangeFile).toHaveBeenCalled();
      expect(input.files[0].name).not.toBe("image.png");
      expect(input.files[0].name).not.toMatch(/(\.jpg|\.jpeg|\.png)$/i);
      expect(newBill.handleChangeFile).toBeTruthy();
    });
  });

  describe("When I am on NewBill Page and I click on submit", () => {
    test("Then handlesubmit should be called", () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(() => newBill.handleSubmit);
      const submitButton = screen.getByTestId("btn-send-bill");
      submitButton.addEventListener("click", handleSubmit);
      userEvent.click(submitButton);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});

// test d'intégration
describe("Given I am connected as an employee", () => {
  describe("When I do fill fields in incorrect format or do not fill fields and I click on submit button", () => {
    test("Then my inputs should be invalid", async () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Get DOMElements
      const inputType = screen.getByTestId("expense-type");
      const inputName = screen.getByTestId("expense-name");
      const inputDate = screen.getByTestId("datepicker");
      const inputAmount = screen.getByTestId("amount");
      const inputVAT = screen.getByTestId("vat");
      const inputPCT = screen.getByTestId("pct");
      const inputComment = screen.getByTestId("commentary");
      const inputFile = screen.getByTestId("file");
      const form = screen.getByTestId("form-new-bill");

      // Input datas
      const formData = {
        type: "Transports",
        name: "nom",
        date: "",
        amount: "ooo",
        vat: 34,
        pct: "",
        file: new File(["img"], "test.jpg", { type: "image/jpg" }),
        commentary: "commentaire",
      };

      // Edit input
      fireEvent.change(inputType, { target: { value: formData.type } });
      fireEvent.change(inputName, { target: { value: formData.name } });
      fireEvent.change(inputDate, { target: { value: formData.date } });
      fireEvent.change(inputAmount, { target: { value: formData.amount } });
      fireEvent.change(inputVAT, { target: { value: formData.vat } });
      fireEvent.change(inputPCT, { target: { value: formData.pct } });
      fireEvent.change(inputComment, {
        target: { value: formData.commentary },
      });
      userEvent.upload(inputFile, formData.file);

      // Submit form
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      // Check if submit function called
      expect(handleSubmit).toHaveBeenCalled();

      // Verify if inputs are invalid
      expect(inputDate.validity.valid).not.toBeTruthy();
      expect(inputAmount.validity.valid).not.toBeTruthy();
      expect(inputPCT.validity.valid).not.toBeTruthy();
    });
  });
  describe("When I do fill fields in correct format and I click on submit button", () => {
    test("Then my inputs should be valid", () => {
      document.body.innerHTML = NewBillUI();

      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Get DOMElements
      const inputType = screen.getByTestId("expense-type");
      const inputName = screen.getByTestId("expense-name");
      const inputDate = screen.getByTestId("datepicker");
      const inputAmount = screen.getByTestId("amount");
      const inputVat = screen.getByTestId("vat");
      const inputPct = screen.getByTestId("pct");
      const inputComment = screen.getByTestId("commentary");
      const form = screen.getByTestId("form-new-bill");
      const inputFile = screen.getByTestId("file");

      // Input datas
      const formData = {
        type: "Transports",
        name: "nom",
        amount: "300",
        date: "2022-04-09",
        vat: 34,
        pct: 54,
        file: new File(["img"], "test.jpg", { type: "image/jpg" }),
        commentary: "commentaire",
      };

      // Edit input
      fireEvent.change(inputType, { target: { value: formData.type } });
      fireEvent.change(inputName, { target: { value: formData.name } });
      fireEvent.change(inputDate, { target: { value: formData.date } });
      fireEvent.change(inputAmount, { target: { value: formData.amount } });
      fireEvent.change(inputVat, { target: { value: formData.vat } });
      fireEvent.change(inputPct, { target: { value: formData.pct } });
      fireEvent.change(inputComment, {
        target: { value: formData.commentary },
      });
      userEvent.upload(inputFile, formData.file);

      // Submit form
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      // Check if submit function called
      expect(handleSubmit).toHaveBeenCalled();

      // Verify input validity
      expect(inputType.validity.valid).toBeTruthy();
      expect(inputName.validity.valid).toBeTruthy();
      expect(inputDate.validity.valid).toBeTruthy();
      expect(inputAmount.validity.valid).toBeTruthy();
      expect(inputVat.validity.valid).toBeTruthy();
      expect(inputPct.validity.valid).toBeTruthy();
      expect(inputComment.validity.valid).toBeTruthy();
      expect(inputFile.files[0]).toBeDefined();
    });
    test("Then newBill should be created", async () => {
      // we have to use mockStore to simulate bill creation
      const updateBill = mockStore.bills().update();
      const addedBill = await updateBill.then((value) => {
        return value;
      });

      expect(addedBill.id).toEqual("47qAXb6fIm2zOKkLzMro");
      expect(addedBill.amount).toEqual(400);
      expect(addedBill.fileUrl).toEqual(
        "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a"
      );
    });
    test("Then It should renders Bills page", () => {
      expect(screen.getAllByText("Mes notes de frais"));
    });
    describe("When an error occurs on API", () => {
      test("Then fetch error 500 from API", async () => {
        jest.spyOn(mockStore, "bills");
        console.error = jest.fn();

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );
        document.body.innerHTML = `<div id="root"></div>`;
        Router();
        window.onNavigate(ROUTES_PATH.NewBill);

        mockStore.bills.mockImplementationOnce(() => {
          return {
            update: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Envoi du formulaire (submit)
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);

        fireEvent.submit(form);
        await new Promise(process.nextTick);
        expect(console.error).toHaveBeenCalled();
      });
    });
  });
});
