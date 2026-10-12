/*
 * Created on 15/12/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch;

import java.util.Date;
import java.util.Vector;

import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.batch.beans.CtiPartBean;
import bzq.shf.batch.beans.CtiShiftBean;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.ShfException;
import bzq.utils.AppResources;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CTIProcess2 extends BaseBatchProcess {

// GLOBAL ARGUMENT
	private int sumShiftAll = 0;
	private long sumShiftOK=0;
	private long sumShiftWithoutStart = 0;
	private long sumShiftWithoutEnd = 0;
	private long sumShiftWithoutStartEnd = 0;
	private long sumTooLongShift = 0;
	private int sumCtiParts = 0;
	private int processKey = 2;

//  COSTANT
	private int CtiShiftSapStatusReady = 2;
	private int CtiShiftSapStatusNOTReady = 0;
	private int CtiShiftBeforCalc = 1;
	private int CtiShiftAfterCalc = 2;
	/**
	 * @param args
	 */
	public CTIProcess2(String[] args) {
		super(args);
		// TODO Auto-generated constructor stub
	}

	public static void main(String[] args) {
		System.out.println( "START :" + new Date());
		CTIProcess2 ctiProcess=new CTIProcess2(args);
		ctiProcess.perform();
		System.out.println("END " + new Date());
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
	public void execute() throws ShfException {
		System.out.println("execute()");
		buildCtiShifts();
		calcRewards();
	}
	/**
	 * 
	 */
	private void buildCtiShifts() throws ShfException {
		System.out.println("buildCtiShifts()");
		boolean firstRec = true;
		Vector partVec = null; //new Vector();
		Vector partForShiftVec = new Vector();
		CtiPartBean currPartBean = null; //new CtiPartBean();
		CtiPartBean lastPartBean = null; //new CtiPartBean();
		long tempI = 0;
		
		partVec = getAllPartForProcess();
		
		for (int i=0; (i<partVec.size())/* && (tempI<10)*/ ;i++) {
			sumCtiParts++;
			if (firstRec) {
				currPartBean = (CtiPartBean)partVec.get(i);
				lastPartBean = (CtiPartBean)partVec.get(i);
			} else {
				lastPartBean = currPartBean;
				currPartBean = (CtiPartBean)partVec.get(i);
			}
			
			if ( !currPartBean.getEmp_id().equals(lastPartBean.getEmp_id()) || firstRec ) {
				// מקטע ראשון לנציג או שהתחלף נציג
				if (!firstRec) {
					buildShiftFromParts(partForShiftVec);
					tempI++;
				}
				partForShiftVec = new Vector();
				partForShiftVec.add(currPartBean);
			} else { // לא מקטע ראשון לנציג
				if ( checkIfPartForSameShift(currPartBean, lastPartBean) ) {
					partForShiftVec.add(currPartBean);
				} else {
					buildShiftFromParts(partForShiftVec); 
					tempI++;
					partForShiftVec = new Vector();
					partForShiftVec.add(currPartBean);
				}
			}
			
//			System.out.println(" emp_id: " + currPartBean.getEmp_id() + " start: " + currPartBean.getCti_part_start() + " end: " + currPartBean.getCti_part_end_update());
			
			firstRec = false;
		}
		
	}

	/**
	 * @param partForShiftVec
	 */
	private void buildShiftFromParts(Vector partForShiftVec) throws ShfException {
		System.out.println("buildShiftFromParts()");
		CtiShiftBean shiftBean = new CtiShiftBean();
		long ctiShiftKey = 0;
		int ctishiftStatus = 0;
		
		System.out.println("*-*-*-*-*--*--*-*-*-*-*-*-*-*-*-*-*-*-*-");

		
		if ( ((CtiPartBean)partForShiftVec.firstElement()).getCti_part_start() != null ) {
			// שמירת שעת הכניסה הראשונה שנמצאה עבור בניית המשמרת
			shiftBean.setCti_shift_start( ((CtiPartBean)partForShiftVec.firstElement()).getCti_part_start() );
		} else {
			sumShiftWithoutStart++;
			ctishiftStatus = ctishiftStatus + ShfBatchConstants.CtiShiftNoStartSTATUS;
		}

		if (((CtiPartBean)partForShiftVec.lastElement()).getCti_part_end() != null ) {
			shiftBean.setCti_shift_end( ((CtiPartBean)partForShiftVec.lastElement()).getCti_part_end() );
		} else {
			ctishiftStatus = ctishiftStatus + ShfBatchConstants.CtiShiftNoEndSTATUS;
			if ( ctishiftStatus == ShfBatchConstants.CtiShiftNoStartEndSTATUS ) {
				sumShiftWithoutStartEnd ++;
				sumShiftWithoutStart--;
			}
			else {
				sumShiftWithoutEnd++;
			}
		}
		if (ctishiftStatus == ShfBatchConstants.CtiShiftOkSTATUS) {
			if (checkShiftLength(shiftBean.getCti_shift_start(), shiftBean.getCti_shift_end()) ) {
				// בדוק האם המשמרת שנוצרה ארוכה מהפרמטר
				sumTooLongShift++;
				ctishiftStatus = ShfBatchConstants.CtiShiftTooLongSTATUS;
			} else {
				sumShiftOK++;
			}
			
			
		}
		shiftBean.setHandle_status(ctishiftStatus); // 0 = OK, 1 = NO START, 2 = NO END, 3 = NO START & NO END, 4 = TOO LONG SHIFT
		shiftBean.setEmp_id(((CtiPartBean)partForShiftVec.firstElement()).getEmp_id());
		System.out.println("shift : " + shiftBean.getEmp_id() + " " + shiftBean.getCti_shift_start() + " " + shiftBean.getCti_shift_end() + " status = " + shiftBean.getHandle_status());
		ctiShiftKey = insertShiftToDB(shiftBean);
		if (ctiShiftKey != 0) {
			sumShiftAll++;
			for (int k=0; k<partForShiftVec.size();k++) {
				updatePartByCtiShiftId(((CtiPartBean)partForShiftVec.get(k)), ctiShiftKey); // לבדוק אפשרות לצרף את עדכון הסטאטוס לפונקציה זאת
				updatePartCtiStatus(((CtiPartBean)partForShiftVec.get(k)), ShfBatchConstants.CtiPartUsedSTATUS);
			}
		}
	System.out.println("END - buildShiftFromParts()");	 
	}

	/**
	 * @param date
	 * @param date2
	 */
	private boolean checkShiftLength(Date startDate, Date endDate) {
		// בדוק האם גודל משמרת אינו חורג מפרמטר גודל משמרת מקסימאלי
		boolean retVal= true;
		long diffTime = 0;
		
		diffTime = endDate.getTime() -  startDate.getTime();
		
		if (diffTime > Integer.parseInt(SHFParameters.getMaxCtiShiftLength(null).getValue())*60*1000 ) {  //  ShfBatchConstants.MaxCtiShiftLength*60*1000) {
			retVal = true;
		} else {
			retVal = false;
		}
		return retVal;
	}

	/**
	 * @param bean
	 * @param ctiShiftKey
	 */
	private void updatePartByCtiShiftId(CtiPartBean partBean, long ctiShiftKey) throws ShfException {
		System.out.println("updatePartByCtiShiftId()");
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_PARTS  ");
		sql.append(" SET CTI_SHIFT_ID = ? "); // 1
		sql.append(" WHERE EMP_ID = ? "); // 2
		sql.append(" AND CTI_START_END_KEY = ? "); // 3

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setLong(param_index++, ctiShiftKey); // 1
			getDbAccess().setString(param_index++,partBean.getEmp_id()); // 2
			getDbAccess().setLong(param_index++,partBean.getCti_start_end_key()); // 3
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updatePartByCtiShiftId()", e);
		}
	}

	/**
	 * @param shiftBean
	 */
	private long insertShiftToDB(CtiShiftBean shiftBean) throws ShfException {
		// TODO Auto-generated method stub
		long ctiShiftKey = 0;
		System.out.println("insertShiftToDB()");
		int param_index=1;
		StringBuffer sql=new StringBuffer();


		ctiShiftKey =  geNextCtiShiftKeyValue();
		
		sql.append(" INSERT INTO SHIFTER.SHF_CTI_SHIFTS (CTI_SHIFT_ID, CTI_SHIFT_END, CTI_SHIFT_END_REWARD, "); 
		sql.append("             CTI_SHIFT_START, CTI_SHIFT_START_REWARD, EMP_ID, ");
		sql.append("             SAP_REQ_ID, SAP_STATUS, UPDATE_DATE, HANDLE_STATUS, SHF_EMPLOYEE_DAY_ID, CREDIT_STATUS) ");
		sql.append("      VALUES (?, ?, null, ");
		sql.append("             ?, null, ?, ");
		sql.append("             null, 0, ?, ?, null, 0)"); 

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setLong(param_index++, ctiShiftKey); // CTI_SHIFT_ID
			getDbAccess().setTimestamp(param_index++, shiftBean.getCti_shift_end()); // CTI_SHIFT_END
			getDbAccess().setTimestamp(param_index++,shiftBean.getCti_shift_start());// CTI_SHIFT_START
			getDbAccess().setString(param_index++, shiftBean.getEmp_id()); // EMP_ID
			getDbAccess().setTimestamp(param_index++, new Date()); //UPDATE_DATE
			getDbAccess().setLong(param_index++,shiftBean.getHandle_status()); // HANDLE_STATUS
			
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("insertShiftToDB()", e);
			//return 0;
		} 
		
		return ctiShiftKey;	
	}

	/**
	 * @param partBean
	 * @param i
	 */
	private void updatePartCtiStatus(CtiPartBean partBean, int status) throws ShfException {
		System.out.println("updatePartCtiStatus()");
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_PARTS  ");
		sql.append(" SET HANDLE_STATUS = ? "); // 1
		sql.append(" WHERE EMP_ID = ? "); // 2
		sql.append(" AND CTI_START_END_KEY = ? "); // 3

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, status); // 1
			getDbAccess().setString(param_index++,partBean.getEmp_id()); // 2
			getDbAccess().setLong(param_index++,partBean.getCti_start_end_key()); // 3
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updatePartCtiStatus()", e);
			
		}		
	}

	/**
	 * @param currPartBean
	 * @param lastPartBean
	 * @return
	 */
	private boolean checkIfPartForSameShift(CtiPartBean currPartBean, CtiPartBean lastPartBean) {
		// בדיקה האם המקטע שייך לאותה משמרת או למשמרת אחרת באותו טווח עיבוד
		boolean retVal = true;
		
		if ( (currPartBean.getCti_part_start() != null) && (lastPartBean.getCti_part_end() != null) ) {
			
			// אם כניסה לאחר יציאה בהפרש קטן או שווה מפרמטר הפרש מחייב אז ממשיכים טיפול 
			if ( ( currPartBean.getCti_part_start().getTime() - lastPartBean.getCti_part_end().getTime() > Integer.parseInt(SHFParameters.getBindingDifference(null).getValue()) *60*1000) ) {
				retVal=false;
			}
		} else if ( (currPartBean.getCti_part_start() != null) && (lastPartBean.getCti_part_start() != null)) {
			// אם אותו סוג החתמה וההפרש הוא קטן או שווה מהפרמטר לחיבור למשמרת אחת אז ממשיכים טיפול
				if ( ( currPartBean.getCti_part_start().getTime() - lastPartBean.getCti_part_start().getTime() > Integer.parseInt(SHFParameters.getMaxDiffrentBetweenSameRecType(null).getValue()) *60*1000) ){
					retVal=false;
				}
			} else if ( (currPartBean.getCti_part_end() != null) && (lastPartBean.getCti_part_end() != null) )  {
				// אם אותו סוג החתמה וההפרש הוא קטן או שווה מהפרמטר לחיבור למשמרת אחת אז ממשיכים טיפול
					if ( ( currPartBean.getCti_part_end().getTime() - lastPartBean.getCti_part_end().getTime() > Integer.parseInt(SHFParameters.getMaxDiffrentBetweenSameRecType(null).getValue()) *60*1000) ){
					    retVal=false;
					}
				} else {
					System.out.println("*******************************");
					System.out.println("******** NOT IN LOGIC *********");
					System.out.println("*******************************");
				}
		return retVal;
	}

	/**
	 * @return
	 */
	private Vector getAllPartForProcess() throws ShfException {
		System.out.println("getAllPartForProcess()");
		Vector recs = new Vector();
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		
		sql.append("SELECT CTI_PART_START,EMP_ID, CTI_PART_END,  "); 
		sql.append(" CTI_PART_END_UPDATE, PROCESS_DATE, UPDATE_DATE, ");
		sql.append(" UPDATE_ID, HANDLE_STATUS,CTI_START_END_KEY ");
		sql.append(" FROM SHIFTER.SHF_CTI_PARTS, SHIFTER.SHF_EMPLOYEES E ");
		sql.append(" WHERE HANDLE_STATUS = ? ");
		sql.append("   AND EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) ");
		sql.append(" ORDER BY EMP_ID, NVL(CTI_PART_START, CTI_PART_END) ");
		
		try{
			CtiPartBean ctiPartBean;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, ShfBatchConstants.CtiPartNotUsedSTATUS);
			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				ctiPartBean=new CtiPartBean();
				getDbAccess().populate(ctiPartBean);
				recs.add(ctiPartBean);
			}
		} catch (DBQueryNoRowsException en) {
			tracerLogger.info("getAllPartForProcess() : no rows to process", en);
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getAllPartForProcess()" + e);
		}
		
		return recs;
	}

	private void calcRewards() throws ShfException {
		Vector ctiShiftForRewards = new Vector();
		
		ctiShiftForRewards = getAllCtiShiftForReward();
		
	}
	
	/**
	 * @return
	 */
	private Vector getAllCtiShiftForReward() throws ShfException {
		Vector recs = new Vector();
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		
		sql.append("select cti_shift_id, cti_shift_end, cti_shift_end_reward, cti_shift_start, cti_shift_start_reward, "); 
		sql.append("emp_id, sap_req_id, sap_status, update_date, handle_status ");
		sql.append(" from shifter.shf_cti_shifts ");
		sql.append(" where handle_status = ? and sap_status = ? ");
		
		try{
			CtiShiftBean ctiBean;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, CtiShiftBeforCalc);
			getDbAccess().setInt(param_index++, CtiShiftSapStatusNOTReady);
	
			getDbAccess().executeQuery();
			while(getDbAccess().next()){
				ctiBean=new CtiShiftBean();
				getDbAccess().populate(ctiBean);
				recs.add(ctiBean);
			}
		} catch (DBQueryNoRowsException en) {
			tracerLogger.info("getAllCtiShiftForReward() : no rows to process", en);
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getAllCtiShiftForReward()" + e);
		}
		
		return recs;
	}
	
	public long geNextCtiShiftKeyValue() throws ShfException{ 
		System.out.println("geNextKeyValue()");
		
		long lastKey; 
		lastKey = 0;
		StringBuffer sql=new StringBuffer();
		//sql.append("select max(t.process_doc_key) from shifter.shf_batch_docs t ");
		sql.append("select shifter.shf_cti_shift_id.nextval from dual ");
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().executeQuery();
			getDbAccess().next();
			lastKey = getDbAccess().getLong(1);
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("geNextCtiShiftKeyValue() :", e);
		}
		
		return lastKey;
	}
	
	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#finishProcess()
	 */
	protected void finishProcess() throws ShfException {
		String str;
		char newLine=13;
		ctiDocBean.setRecordsScanned(new Integer(sumCtiParts));
		ctiDocBean.setRecordsAdded(new Integer(sumShiftAll));
		ctiDocBean.setSapReqId(0);
		ctiDocBean.setP2_4_OkShift(sumShiftOK);
		ctiDocBean.setP2_4_ShiftNoStart(sumShiftWithoutStart);
		ctiDocBean.setP2_4_ShiftNoEnd(sumShiftWithoutEnd);
		ctiDocBean.setP2_4_LongShift(sumTooLongShift);
		
		insertDocs(ctiDocBean);
		
		str = " -*-*-*-*-*-*-* SUMERY FOR CTI-PART TO SHIFT *-*-*-*-*-*-*-*-" + newLine;
		tracerLogger.info(str); //System.out.println(str);
		str = "sumCtiParts : " + sumCtiParts + newLine;
		tracerLogger.info(str); //System.out.println(str);
		str = "sumShiftOK : " + sumShiftOK + newLine;
		tracerLogger.info(str); //System.out.println(str);
		str = "sumShiftWithoutStart :" + sumShiftWithoutStart + newLine;
		tracerLogger.info(str); //System.out.println(str);
		str = "sumShiftWithoutEnd : " + sumShiftWithoutEnd + newLine;
		tracerLogger.info(str); //System.out.println(str);
		str = "sumShiftWithoutStartEnd : " + sumShiftWithoutStartEnd + newLine;
		tracerLogger.info(str); //System.out.println(str);
		str = "sumTooLongShift : " + sumTooLongShift + newLine;
		tracerLogger.info(str); //System.out.println(str);
		str = "sumShiftAll : " + sumShiftAll + newLine;
		tracerLogger.info(str); //System.out.println(str);
		System.out.println(" -*-*-*-*-*-*-* FINISH CTI-PART TO SHIFT *-*-*-*-*-*-*-*-");
 
	
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#initProcess()
	 */
	protected void initProcess() throws Exception {
		AppResources.getInstance().setTablesContainer(ShfBatchConstants.tc);
		loadSystemParam();

	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#initProcessArguments()
	 */
	protected void initProcessArguments() throws Exception {
		// TODO Auto-generated method stub

	}
}
