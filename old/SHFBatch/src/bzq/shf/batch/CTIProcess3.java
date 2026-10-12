/*
 * Created on 15/12/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch;

import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Vector;

import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.batch.beans.CtiShiftBean;
import bzq.shf.batch.beans.CtiUnitCreditBean;
import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.model.LoadTables;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CTIProcess3 extends BaseBatchProcess {

// GLOBAL ARGUMENT
	private long sumCtiShiftFoundSHF = 0;
	private long sumSystemCredit = 0;
	private long sumSystemCreditUserNotFound = 0;
	private long sumSystemCreditUnitCodeNotFound = 0;
	
	private long sumBriefCredit = 0;
	private long sumBriefCreditUserNotFound = 0;
	private long sumBriefCreditUnitCodeNotFound = 0;
	
	private int sumRecCalced =0;
	private long sumDup=0;
	private int sumScanedForSystemCredit = 0;
//	private static int processKey = 3;
	

//  COSTANT
	private static HashMap creditUnitHM = new HashMap();
	private static HashMap orgUnitsHM = new HashMap();
	private static Vector ctiUnitCreditVec = new Vector();
	private static HashMap shiftHasBennCalced = new HashMap();


	/**
	 * @param args
	 */
	public CTIProcess3(String[] args) {
		super(args);
		// TODO Auto-generated constructor stub
	}

	public static void main(String[] args) {
		System.out.println( " Process Credit START :" + new Date());
		CTIProcess3 ctiProcess=new CTIProcess3(args);
		ctiProcess.perform();
		System.out.println(" Process Credit END " + new Date());
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#createProcessBeanObject()
	 */
	protected Object createProcessBeanObject() {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#execute()
	 */
	public void execute() throws ShfException  {
		System.out.println("execute()");
		compareCtiWithShf();
		calcCredits();
	}
	
	private void compareCtiWithShf() throws ShfException {
	// בדיקת התאמה בין משמרת סיטיאיי למשמרת שיפטר
		Vector ctiShiftForRewards = getAllCtiShiftForUpdate();
		for (int i=0; i<ctiShiftForRewards.size(); i++) {
			CtiShiftBean ctiShift = null; //new CtiShiftBean();
			ctiShift = (CtiShiftBean)ctiShiftForRewards.get(i);
			updateCtiShiftWithShfDayId(ctiShift);
			sumCtiShiftFoundSHF++;
			updateStatusForLoginCancelFromSHF(ctiShift);
		}
	}

	private void updateCtiShiftWithShfDayId(CtiShiftBean ctiShift) throws ShfException {
		System.out.println("updateCtiShiftWithShfDayId()");
		int param_index=1;
				
		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_SHIFTS  ");
		sql.append(" SET SHF_EMPLOYEE_DAY_ID = ? "); // 1
		sql.append(" WHERE CTI_SHIFT_ID = ? "); // 2
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setLong(param_index++, ctiShift.getShf_employee_day_id()); // 1
			getDbAccess().setLong(param_index++,ctiShift.getCti_shift_id()); // 2
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateCtiShiftWithShfDayId", e);
		}		
	}

	private void calcCredits() throws ShfException {
		//חישוב כל התוספות עבור משמרת
		calcSystemCredit();
		calcForBrief();
		calcTimeForCredit();
	}

	private void calcTimeForCredit() throws ShfException {
		// חישוב ועדכון זמני התוספות עבור משמרת
		Iterator it = shiftHasBennCalced.keySet().iterator();
		long minuteToAdd=0;
		long shiftCtiCode = 0;
		while(it.hasNext()) {
			minuteToAdd =0;
			shiftCtiCode =  Long.parseLong((String)it.next());
			minuteToAdd = getTimeCreditToAdd(shiftCtiCode);
			if (minuteToAdd > 0) {
				updateCreditTimeForShift(shiftCtiCode, minuteToAdd);
			}
			updateCtiShiftCreditStatus(shiftCtiCode, ShfBatchConstants.shiftCreditCalcedSTATUS);
			sumRecCalced++;
		}
	}

	private void updateCreditTimeForShift(long shiftCtiCode, long minuteToAdd) throws ShfException {
		// עדכון זמן התחלת המשמרת לאחר כל התוספות
		System.out.println("updateCreditTimeForShift()");
		int param_index=1;
	
		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_SHIFTS ");
		sql.append("    SET CTI_SHIFT_START_REWARD = CTI_SHIFT_START - ?/1440 "); // 1
		sql.append("  WHERE CTI_SHIFT_START IS NOT NULL "); 
		sql.append("    AND CTI_SHIFT_ID = ?  "); // 2

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setLong(param_index++, minuteToAdd); // 1
			getDbAccess().setLong(param_index++,shiftCtiCode); // 2
			getDbAccess().executeUpdate();
			
		}catch (DBUpdateNoRowsException en) {
			
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateCreditTimeForShift ", e);
		}		
	}

	private void updateStatusForLoginCancelFromSHF(CtiShiftBean ctiShift) throws ShfException {
		if (checkIsShiftFound(ctiShift.getShf_employee_day_id()) ){
			updateCtiShiftSapStatus(ctiShift.getCti_shift_id(),ShfBatchConstants.CtiLoginCancel_NoDeliver);
			updateLoginCancelWithCtiShift(ctiShift);
		}
	}

	private boolean checkIsShiftFound(long agentDayId) throws ShfException {

		boolean RC = true;
		int param_index=1;

		StringBuffer sql=new StringBuffer();
		sql.append("SELECT CTI_SHIFT_ID  "); 
		sql.append("  FROM SHIFTER.SHF_CTI_CANCEL_LOGIN_SHIFTS ");
		sql.append(" WHERE SHF_EMPLOYEE_DAY_ID = ? ");

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setLong(param_index++, agentDayId);
				getDbAccess().executeQuery();
		}catch (DBQueryNoRowsException en) {
			RC = false;
		}
		catch(DBException e){
			e.printStackTrace();
			throw new ShfException(" checkIsShiftFound() :", e);
		}
	return RC;
	}

	
	private void updateLoginCancelWithCtiShift(CtiShiftBean ctiShift) throws ShfException{
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_CANCEL_LOGIN_SHIFTS  ");
		sql.append(" SET CTI_SHIFT_ID  = ? "); // 1
		sql.append(" WHERE SHF_EMPLOYEE_DAY_ID = ? "); // 2
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setLong(param_index++, ctiShift.getCti_shift_id()); // 1
			getDbAccess().setLong(param_index++,ctiShift.getShf_employee_day_id()); // 2
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateLoginCancelWithCtiShift", e);
		}		
	}

	private long getTimeCreditToAdd(long shiftCtiCode) throws ShfException {
		// חשב את סך כל הזמן שיש להוסיף עבור המשמרת
		long retVal=0;
		Vector shiftUnitVec = null;
		CtiUnitCreditBean ctiUnitCreditBean = null;
		shiftUnitVec = getAllCreditForShift(shiftCtiCode);
		for (int i=0; i< shiftUnitVec.size(); i++) {
			ctiUnitCreditBean = (CtiUnitCreditBean)shiftUnitVec.get(i);
			retVal = retVal + getMinuteToAdd(ctiUnitCreditBean);
		}
		
		return retVal;
	}

	private Vector getAllCreditForShift(long shiftCtiCode) throws ShfException {
		// הבא את כל רשומות התוספת עבור משמרת לצורך חישוב התוספת זמן בפועל
		System.out.println("getAllCreditForShift()");
		Vector recs = new Vector();
		int param_index=1;

		StringBuffer sql=new StringBuffer();
		sql.append("SELECT UPDATE_DATE, UPDATE_ID, CTI_SHIFT_ID, CREDIT_CODE, UNIT_CODE "); 
		sql.append("  FROM SHIFTER.SHF_CTI_SHIFT_CREDIT ");
		sql.append(" WHERE CTI_SHIFT_ID = ? ");
		try{
			CtiUnitCreditBean ctiUnitCreditBean;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setLong(param_index++, shiftCtiCode);
	
			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				ctiUnitCreditBean = new CtiUnitCreditBean();
				getDbAccess().populate(ctiUnitCreditBean);
				recs.add(ctiUnitCreditBean);
			}
		}catch (DBQueryNoRowsException en) {
			
		}
		catch(DBException e){
			e.printStackTrace();
			throw new ShfException(" getAllCreditForShift() :", e);
		}

		return recs;	
	}

	private void updateCtiShiftCreditStatus(long shiftCtiCode, int status) throws ShfException {
		//עדכון סטאטוס תוספת למשמרת
		System.out.println("updateCtiShiftCreditStatus()");
		int param_index=1;
	
		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_SHIFTS ");
		sql.append("    SET CREDIT_STATUS = ? "); // 1
		sql.append("  WHERE CTI_SHIFT_ID = ? "); // 2

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, status); // 1
			getDbAccess().setLong(param_index++,shiftCtiCode); // 2
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateCtiShiftCreditStatus : ", e);
		}
	}

	
	private void updateCtiShiftSapStatus(long shiftCtiCode, int status) throws ShfException {
		//עדכון סטאטוס סאפ
		System.out.println("updateCtiShiftSapStatus()");
		int param_index=1;
	
		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_SHIFTS ");
		sql.append("    SET SAP_STATUS = ? "); // 1
		sql.append("  WHERE CTI_SHIFT_ID = ? "); // 2

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, status); // 1
			getDbAccess().setLong(param_index++,shiftCtiCode); // 2
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateCtiShiftSapStatus : ", e);
		}
	}
	
	private void calcForBrief() throws ShfException {
		// חשב תוספת עבור תדרוך
		Vector recVec = null; //new Vector();
		CtiShiftBean ctiShiftBean = null; //new CtiShiftBean();
		String unitCode = null; //new String();
		recVec = getAllCtiShiftForBrief();
		for (int i=0; i<recVec.size(); i++) {
			ctiShiftBean = (CtiShiftBean)recVec.get(i);
			insertIntoHashMap(String.valueOf(ctiShiftBean.getCti_shift_id()));			
			if (ctiShiftBean.getOrgUnitCode() == null) {
				sumBriefCreditUserNotFound++;
			} else {
				unitCode = ShfBatchConstants.getAgafCodeOf(ctiShiftBean.getOrgUnitCode());
				if (unitCode != null) {
					updateShiftUnitCredit(ShfBatchConstants.CreditBrief, unitCode, ctiShiftBean.getCti_shift_id());
				} else {
					sumBriefCreditUnitCodeNotFound++;
				}
				sumBriefCredit++;
				//TODO לבדוק עם מוראד האם להחליף לשליפה בצורה אחרת
			}
			
		}
	}


	private Vector getAllCtiShiftForBrief() throws ShfException {
		System.out.println("getAllCtiShiftForBrief()");
		// הבא את כל הרשומות המתאימות לקבלת תוספת עבור תדרוך
		Vector recs = new Vector();
		int param_index=1;
		String unitS= null; // אם רוצים שהפרמטרים יהיו לפי אגף, צריך להביא את היחדיה הארגונית של העובד בכל פעם
		StringBuffer sql=new StringBuffer();
		
		sql.append("SELECT D.SHF_EMPLOYEE_DAY_ID, S.CTI_SHIFT_ID, S.CTI_SHIFT_START, "); 
		sql.append(" 	   S.CTI_SHIFT_END, S.EMP_ID, E.ORG_UNIT_ID ");
		sql.append("  FROM SHIFTER.SHF_EMPLOYEE_DAY D ");
		sql.append("       LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON D.SHF_EMPLOYEE_DAY_ID = C.SHF_EMPLOYEE_DAY_ID ");
		sql.append("       LEFT JOIN SHIFTER.SHF_CTI_SHIFTS S ON S.EMP_ID = NVL(C.NEW_EMPLOYEE_ID, D.EMP_ID_NUMBER) ");
		sql.append("       LEFT JOIN SHIFTER.SHF_ATTENDANCE A ON A.SHF_EMPLOYEE_DAY_ID = D.SHF_EMPLOYEE_DAY_ID ");
		sql.append("       LEFT JOIN SHIFTER.SHF_EMPLOYEES E  ON SUBSTR(E.EMP_ID_NUMBER,1,8) = S.EMP_ID ");
		sql.append(" WHERE A.STATION_ARRIVAL_TIME BETWEEN (S.CTI_SHIFT_START - ?/1440) AND  (S.CTI_SHIFT_START + ?/1440) ");
		sql.append("   AND TO_DATE(S.CTI_SHIFT_START, 'DD/MM/YYYY') = NVL(TO_DATE(C.NEW_SHIFT_START,'DD/MM/YYYY'), TO_DATE(D.WM_SHIFT_START_DATETIME,'DD/MM/YYYY')) ");
		//check that there is no attendance from other day - yuval - 09.02.2011 
		sql.append("   AND S.CREDIT_STATUS = ? ");
		sql.append("   AND S.SAP_STATUS = ? ");
		sql.append("   AND A.TADREECH = ? ");
		sql.append("   AND S.EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) "); //check this
			
		try{
			CtiShiftBean ctiBean;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, Integer.parseInt(SHFParameters.getMaxDiffrentBetweenShfAndCti(unitS).getValue()));
			getDbAccess().setInt(param_index++, Integer.parseInt(SHFParameters.getMaxDiffrentBetweenShfAndCti(unitS).getValue()));
			getDbAccess().setInt(param_index++, ShfBatchConstants.shiftCreditNotCalcedSTATUS);
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiSapNotDeliveredSTATUS);
			getDbAccess().setInt(param_index++, ShfBatchConstants.CreditTadreechExist);
			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				ctiBean=new CtiShiftBean();
				getDbAccess().populate(ctiBean);
				recs.add(ctiBean);
			}
		}catch (DBQueryNoRowsException en) {
			tracerLogger.info("no rows for : getAllCtiShiftForBrief");
		}
		catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getAllCtiShiftForBrief", e);
		}
		return recs;
	}


	private void calcSystemCredit() throws ShfException {
		// חישוב תוספת מערכת
		Vector recVec = getAllCtiShiftForSystemCredit();
		CtiShiftBean ctiShiftBean = null;
		String unitCode = null;

		long minute;
		for (int i=0; i<recVec.size(); i++) {
			sumScanedForSystemCredit++;
			ctiShiftBean = (CtiShiftBean)recVec.get(i);
			insertIntoHashMap(String.valueOf(ctiShiftBean.getCti_shift_id()));
			if (ctiShiftBean.getOrgUnitCode() == null) {
				sumSystemCreditUserNotFound++;
			} else {
				unitCode = ShfBatchConstants.getAgafCodeOf(ctiShiftBean.getOrgUnitCode());
				if (unitCode != null) {
					updateShiftUnitCredit(ShfBatchConstants.CreditSystem, unitCode, ctiShiftBean.getCti_shift_id());
				} else {
					sumSystemCreditUnitCodeNotFound++;
				}
				sumSystemCredit++;
			}
			
		}
		
	}


	private void insertIntoHashMap(String ctiShiftCode) {
		shiftHasBennCalced.put(ctiShiftCode, ctiShiftCode);
	}


	private void updateShiftUnitCredit(int creditCode, String unitCode, long ctiShiftId) throws ShfException {
		System.out.println("updateShiftUnitCredit() creditCode : " + creditCode + ",  shift id = " + ctiShiftId + ", unitCode = " + unitCode);
		int param_index=1;
		StringBuffer sql=new StringBuffer();
		
		sql.append(" INSERT INTO SHIFTER.SHF_CTI_SHIFT_CREDIT (UPDATE_DATE, UPDATE_ID, CTI_SHIFT_ID, "); 
		sql.append(" CREDIT_CODE, UNIT_CODE) ");
		sql.append(" VALUES (?,?,?,?,?)  ");
		
		
		try{
			getDbAccess().prepareStatement(sql.toString());
			
			getDbAccess().setTimestamp(param_index++, new Date()); // UPDATE_DATE
			getDbAccess().setString(param_index++, ShfBatchConstants.SystemUserId); // UPDATE_ID
			getDbAccess().setLong(param_index++,ctiShiftId);// CTI_SHIFT_ID
			getDbAccess().setInt(param_index++, creditCode); // CREDIT_CODE
			getDbAccess().setString(param_index++, unitCode); //UNIT_CODE
					
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			String str = "updateShiftUnitCredit() creditCode: " + creditCode + "  shift id = " + ctiShiftId + " unitCode = " + unitCode;
			tracerLogger.info(str);
			throw new ShfException("updateShiftUnitCredit",e);
		} 
	}

	/**
	 * @param i
	 * @param unitCode
	 * @return
	 */
	private long findCredit(int creditCode, String unitCode) {
		long retVal = 0;
		for (int i=0; i<ctiUnitCreditVec.size(); i++) {
			CtiUnitCreditBean creditBean = null; 
			creditBean = (CtiUnitCreditBean)ctiUnitCreditVec.get(i);
			if ( (creditCode == creditBean.getCredit_code()) && (creditBean.getUnit_code().equals(unitCode)) ) {
				retVal = creditBean.getCredit_vlaue().longValue();
			}
		}
		return retVal;
	}

	/**
	 * @param creditCode
	 * @param unitCode
	 * @return
	 */
	private long getMinuteToAdd(CtiUnitCreditBean toCalcUnitCreditBean) {
		long retVal = 0;
		for (int i=0; i<ctiUnitCreditVec.size(); i++) {
			CtiUnitCreditBean creditBean = null; //new CtiUnitCreditBean();
			creditBean = (CtiUnitCreditBean)ctiUnitCreditVec.get(i);
			if ( (toCalcUnitCreditBean.getCredit_code() == creditBean.getCredit_code()) && (creditBean.getUnit_code().equals(toCalcUnitCreditBean.getUnit_code())) ) {
				retVal = creditBean.getCredit_vlaue().longValue();
			}
		}
		return retVal;
	}

	/**
	 * @return
	 */
	private Vector getAllCtiShiftForSystemCredit() throws ShfException {
		System.out.println("getAllCtiShiftForSystemCredit()");
		Vector recs = new Vector();
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();

		sql.append("SELECT S.CTI_SHIFT_ID, S.EMP_ID, E.ORG_UNIT_ID "); 
		sql.append("  FROM SHIFTER.SHF_CTI_SHIFTS S ");
		sql.append("       LEFT JOIN SHIFTER.SHF_EMPLOYEES E  ON SUBSTR(E.EMP_ID_NUMBER,1,8) = S.EMP_ID ");
		sql.append(" WHERE S.CREDIT_STATUS = ?  ");
		sql.append("   AND S.SAP_STATUS = ? ");
		sql.append("   AND S.EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) "); //check this
		try{
			CtiShiftBean ctiBean;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.shiftCreditNotCalcedSTATUS);
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiSapNotDeliveredSTATUS);
	
			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				ctiBean=new CtiShiftBean();
				getDbAccess().populate(ctiBean);
				recs.add(ctiBean);
			}
		} catch (DBQueryNoRowsException en) {
			tracerLogger.info("no rows for : getAllCtiShiftForSystemCredit");
		}
		catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getAllCtiShiftForSystemCredit : ", e);
		}

		return recs;		
	}

	/**
	 * @return
	 */
	private Vector getAllCtiShiftForUpdate() throws ShfException {
		Vector recs = new Vector();
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();

		sql.append("SELECT D.SHF_EMPLOYEE_DAY_ID, S.CTI_SHIFT_ID, S.CTI_SHIFT_START, "); 
		sql.append(" 	   S.CTI_SHIFT_END, S.EMP_ID ");
		sql.append("  FROM SHIFTER.SHF_EMPLOYEE_DAY D ");
		sql.append("       LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON D.SHF_EMPLOYEE_DAY_ID = C.SHF_EMPLOYEE_DAY_ID ");
		sql.append("       LEFT JOIN SHIFTER.SHF_CTI_SHIFTS S ON S.EMP_ID = NVL(C.NEW_EMPLOYEE_ID, D.EMP_ID_NUMBER) ");
		sql.append("       LEFT JOIN SHIFTER.SHF_ATTENDANCE A ON A.SHF_EMPLOYEE_DAY_ID = D.SHF_EMPLOYEE_DAY_ID ");
		sql.append("       LEFT JOIN SHIFTER.SHF_EMPLOYEES E  ON SUBSTR(E.EMP_ID_NUMBER,1,8) = S.EMP_ID "); // check this
		sql.append(" WHERE A.STAGE_ARRIVAL_TIME BETWEEN (S.CTI_SHIFT_START - ?/1440) AND  (S.CTI_SHIFT_START + ?/1440) ");
		sql.append("   AND S.CREDIT_STATUS = ? ");
		sql.append("   AND S.SAP_STATUS = ? ");
		sql.append("   AND S.SHF_EMPLOYEE_DAY_ID IS NULL ");
		sql.append("   AND S.EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) "); //check this
		
		
		try{
			CtiShiftBean ctiBean;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, Integer.parseInt(SHFParameters.getMaxDiffrentBetweenShfAndCti(null).getValue()));
			getDbAccess().setInt(param_index++, Integer.parseInt(SHFParameters.getMaxDiffrentBetweenShfAndCti(null).getValue()));
			getDbAccess().setInt(param_index++, ShfBatchConstants.shiftCreditNotCalcedSTATUS);
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiSapNotDeliveredSTATUS);

			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				ctiBean=new CtiShiftBean();
				getDbAccess().populate(ctiBean);
				recs.add(ctiBean);
			}
		}catch (DBQueryNoRowsException en) {
				
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getAllCtiShiftForUpdate", e);
		}
		
		return recs;
	}
		
		
	private void loadCreditForUnit() throws ShfException {
		System.out.println("loadCreditForUnit()");
		
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT CREDIT_CODE, UNIT_CODE, CREDIT_VLAUE, ");
		sql.append(" UPDATE_DATE, UPDATE_ID ");
		sql.append(" FROM  SHIFTER.SHF_CTI_UNIT_CREDITS "); 
		
		try{
			getDbAccess().prepareStatement(sql.toString());

			CtiUnitCreditBean ctiUnitCredit;
			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				ctiUnitCredit = new CtiUnitCreditBean();
				getDbAccess().populate(ctiUnitCredit);
				// static vector - until i will fix the HM
				ctiUnitCreditVec.add(ctiUnitCredit);
			}

		}catch (DBQueryNoRowsException en) {
			
		}
		catch(DBException e){
			e.printStackTrace();
			throw new ShfException("loadCreditForUnit : ", e);
		}
	}

//	private void insertDocs(BatchCtiDocBean docBean) throws ShfException {
//		System.out.println("insertDocs()");
//		int param_index=1;
//		long nexValKey = 0;
//		StringBuffer sql=new StringBuffer();
//
//		nexValKey = geNextDocKeyValue();
//
//		sql.append(" INSERT INTO SHIFTER.SHF_BATCH_DOCS (PROCESS_DOC_KEY, PROCESS_KEY, EXEC_DATE, DOC_DESC, "); 
//		sql.append("             LAST_COMMIT_REC, OPERATION_PRM, PROCESS_STATUS, REC_ADDED, REC_INVALID, ");
//		sql.append("             REC_MODIFIED, REC_SCANED, SOURCE_KEY, STEP_IN_PROGRESS, TRIGGER_DATE, START_PROCESS_DATE, END_PROCESS_DATE, SAP_REQ_ID) ");
//		sql.append("      VALUES (?, ?, ?, null, ");
//		sql.append("             null, null, ?, ?, 0, ");
//		sql.append("             0, ?, 0, null, null, ?, ?, ?)");
//		
//		// cti_part_start, emp_id, cti_part_end, cti_part_end_update, process_date, update_date, update_id,	handle_status, cti_start_end_key 
//
//		try{
//			getDbAccess().prepareStatement(sql.toString());
//			getDbAccess().setLong(param_index++, nexValKey); // PROCESS_DOC_KEY
//			getDbAccess().setInteger(param_index++, docBean.getProcessKey()); // PROCESS_KEY
//			getDbAccess().setTimestamp(param_index++,new Date());// EXEC_DATE
//			getDbAccess().setString(param_index++, docBean.getProcessStatus()); // PROCESS_STATUS
//			getDbAccess().setInteger(param_index++, docBean.getRecordsAdded()); //REC_ADDED
//			getDbAccess().setInteger(param_index++,docBean.getRecordsScanned()); // REC_SCANED
//			getDbAccess().setTimestamp(param_index++, docBean.getStartProcessDate()); // START_PROCESS_DATE
//			getDbAccess().setTimestamp(param_index++, docBean.getEndProcessDate()); // END_PROCESS_DATE
//			getDbAccess().setLong(param_index++, docBean.getSapReqId()); // SAP_REQ_ID
//			
//			getDbAccess().executeUpdate();
//		}catch(DBException e){
//			e.printStackTrace();
//			throw new ShfException("insertDocs() : ", e);
//		}
//		
//	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#finishProcess()
	 */
	protected void finishProcess() throws ShfException {
		String str;
		char newLine=13;
		ctiDocBean.setRecordsScanned(new Integer(sumScanedForSystemCredit));
		ctiDocBean.setRecordsAdded(new Integer(sumRecCalced));
		ctiDocBean.setSapReqId(0);
		ctiDocBean.setP3_CtiWithShf(sumCtiShiftFoundSHF);
		ctiDocBean.setP3Tidruch(sumBriefCredit);
		ctiDocBean.setP3TidruchNoOrg(sumBriefCreditUnitCodeNotFound);
		ctiDocBean.setP3TidruchNoUser(sumBriefCreditUserNotFound);
		ctiDocBean.setP3SumSystem(sumSystemCredit);
		ctiDocBean.setP3SystemNoOrg(sumSystemCreditUnitCodeNotFound);
		ctiDocBean.setP3SystemNoUser(sumSystemCreditUserNotFound);
		
		
		insertDocs(ctiDocBean);

		str = " -*-*-*-*-*-*-* SUMERY OF CREDIT FOR SHIFT *-*-*-*-*-*-*-*-" + newLine;
		tracerLogger.info(str);
		str = "sumRecCalced : " + sumRecCalced + newLine;
		tracerLogger.info(str);
		str = "-=-=-=-=-=-=-=-" + newLine;
		tracerLogger.info(str);
		str = "sumCtiShiftFoundSHF : " + sumCtiShiftFoundSHF + newLine;
		tracerLogger.info(str);
		str = "-=-=-=-=-=-=-=-" + newLine;
		tracerLogger.info(str);
		str = "sumBriefCredit : " + sumBriefCredit + newLine;
		tracerLogger.info(str);
		str = "sumBriefCreditUserNotFound : " + sumBriefCreditUserNotFound + newLine;
		tracerLogger.info(str);
		str = "sumBriefCreditUnitCodeNotFound : " + sumBriefCreditUnitCodeNotFound + newLine;
		tracerLogger.info(str);
		str = "-=-=-=-=-=-=-=-" + newLine;
		tracerLogger.info(str);
		str = "sumSystemCredit : " + sumSystemCredit + newLine;
		tracerLogger.info(str);
		str = "sumSystemCreditUserNotFound : " + sumSystemCreditUserNotFound + newLine;
		tracerLogger.info(str);
		str = "sumSystemCreditUnitCodeNotFound : " + sumSystemCreditUnitCodeNotFound + newLine;
		tracerLogger.info(str);
		str = "-=-=-=-=-=-=-=-" + newLine;
		tracerLogger.info(str);
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#initProcess()
	 */
	protected void initProcess() throws Exception {
		loadCreditForUnit();
		loadOrgUnits();
		AppResources.getInstance().setTablesContainer(ShfBatchConstants.tc);
		loadSystemParam();
	}

	/**
	 * 
	 */
	private void loadOrgUnits() {
		System.out.println("start : loadOrgUnits()");
		
		LoadTables loadTables = new LoadTables(ShfBatchConstants.tc);
		try {
			loadTables.loadOrgUnit();
		} catch (DBException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		
		Vector c=ShfBatchConstants.tc.getTable(TablesConstants.UNIT_TABLE);
		OrgUnitTableForm unitTableForm =  null;
		
		for (int i =0; i<c.size(); i++) {
			unitTableForm = (OrgUnitTableForm)c.get(i);
			orgUnitsHM.put(unitTableForm.getCode(), unitTableForm.getParent()); 
		}
		
		System.out.println("end : loadOrgUnits()");
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#initProcessArguments()
	 */
	protected void initProcessArguments() throws Exception {
	}

}
