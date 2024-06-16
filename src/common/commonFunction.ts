import { TypeBankName } from "../enum/enumeration";

const commonFunction = {
  /**
   * Lấy BankId theo tên ngân hàng
   * @param bankName Tên ngân hàng
   * @returns Mã ngân hàng
   */
  getBankId: function (bankName: TypeBankName) {
    switch (bankName) {
      case TypeBankName.MBBank:
        return "MB";
      default:
        return "";
    }
  },
};

export default commonFunction;
