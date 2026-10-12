/*
 * Created on 16/12/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch;

import java.util.Vector;

import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.utils.TablesContainer;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShfBatchConstants {
	
	
	public static TablesContainer tc = new TablesContainer();
	public static final String SystemUserId = "123456789";
	//CTI DATA
	public static final int CtiInputIN = 1;
	public static final int CtiInputOUT = 0;
	
	
	public static final int SaftyRangForProcess = 12; //hour
	public static final int BindingDifference = 120; //minut הפרש מחייב בדקות
	//
	public static final int MaxDiffrentBetweenShfAndCti = 120; //minut  הפרש מקסימאלי בין התחלה של משמרת סיטיאי לתחילת משמרת שיפטר
	public static final int MaxDiffrentBetweenSameRecType = 120 ; //minut  הפרש מקסימאלי בין אותו סוג החתמה לחיבור בין מקטעים למשמרת אחת 
	//יש תלות בין שני המשתנים האלו, רצוי שיהיה אותו משתנה
	public static final int MaxCtiShiftLength = 900; //minut  אורך מקסימאלי למשמרת סיטיאי
	
	// סטאטוסים של משמרות
	public static final int CtiShiftOkSTATUS = 0; // משמרת תקינה
	public static final int CtiShiftNoStartSTATUS = 1; // משמרת ללא התחלה
	public static final int CtiShiftNoEndSTATUS = 2; // משמרת ללא סיום
	public static final int CtiShiftNoStartEndSTATUS = 3; // משמרת ללא התחלה וללא סיום 
	public static final int CtiShiftTooLongSTATUS = 4;  // משמרת ארוכה מהמותר לפי פרמטר
	
	//Parts
	public static final int CtiPartNotUsedSTATUS = 0; // עדיין לא עבר תהליך עיבוד למשמרת
	public static final int CtiPartUsedSTATUS = 1; // עבר תהליך עיבוד למשמרת
	
	//SAP
	public static final int CtiSapNotDeliveredSTATUS = 0;
	public static final int CtiSapDeliveredSTATUS = 10;
	public static final int CtiSapNotOkSTATUS = 9;
	public static final int CtiSapToDeliver = 1;
	public static final int CtiNeverDeliver = 99;
	public static final int CtiEmpNotActive_NoDeliver= 90;
	public static final int CtiLoginCancel_NoDeliver= 91;
	
	//EMPLOYEES
	public static final int Optional1NotDeliverToSap = 0;
	public static final int Optional1DeliverToSap = 1;
	public static final int Optional2NoAutoToSap = 1;
	public static final int Optional2AutoToSap = 0;
	public static final int EmployeeTempNotActiveStatus = 1;
	public static final int EmployeeNotActiveStatus = 2;
	public static final int EmployeeActiveStatus = 3;
	
	//CREDIT CALC
	public static final int CreditSystem = 1;
	public static final int CreditBrief = 3;
	public static final int CreditTadreechNotExist = 0;
	public static final int CreditTadreechExist = 1;
	
	
	//SHIFT CREDIT STATUS
	public static final int shiftCreditNotCalcedSTATUS = 0;
	public static final int shiftCreditCalcedSTATUS = 1;

	//COMPLETION CREDIT STATUS
	public static final int completionNotCalcedSTATUS = 0;
	public static final int completionCalcedSTATUS = 1;
	public static final int completionToSap = 1;
	
	
	public static final String STATUS_COMPLETE="C";

	public static final String STATUS_IN_PROCESS="P";

	public static final int DELETE_BATCH_DOC=0;

	public static final String STATUS_ERROR="E";
	
	public static final String STATUS_READY="R";
	
	public static final String ANV_APPL_ID="SHF";

	//SAP PROCESS
	public static final String Sap_Line_IN ="P10";
	public static final String Sap_Line_OUT ="P20";
	public static final String Sap_ClockNumber ="6666";
	public static final String Sap_8spaces = "        ";
	public static final String Sap_4spaces = "    ";

	
	public static final int HoldJobTableUpdate = -1;
//UNIT TABLES LOAD

	public static String getAgafCodeOf(String code){
		OrgUnitTableForm org=getUnitByCode(code);
		if(org==null) return null;
		String parent=org.getParent();
		if(org.getType().equals(SHFConstants.AGAF_UNIT)) {
			return code;
		}
		if(org.getType().equals(SHFConstants.MOKED_UNIT)) {
			return parent;
		}
		if(org.getType().equals(SHFConstants.TEAM_UNIT)) {
			return getUnitByCode(parent).getParent();
		}
		return null;
	}	
	

	public static OrgUnitTableForm getUnitByCode(String code){
		OrgUnitTableForm org=null;
		Vector units=tc.getTable("unitCode");
		if(units!=null) {
			for(int i=0;i<units.size();i++){
				Object obj=units.get(i);
				if(obj instanceof OrgUnitTableForm){
					org=(OrgUnitTableForm)obj;
					if(org.getCode().equals(code)){
						return org;
					}
				}
			}
		}
		return org;
	}
}
