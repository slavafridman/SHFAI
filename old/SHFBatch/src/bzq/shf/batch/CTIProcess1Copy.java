/*
 * Created on 06/12/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch;

import java.util.Calendar;
import java.util.Date;
import java.util.Vector;

import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.batch.beans.CtiInputBean;
import bzq.shf.batch.beans.CtiPartBean;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.ShfException;
import bzq.utils.AppResources;

public class CTIProcess1Copy extends BaseBatchProcess{

	
	private Date EndDateForProcess = null;
	private Date LastProcessDate = null; 
	private int sumAllCTIInput;//= new Integer(0);
	private int sumPart;//=new Integer(0);
	private int sumPartWithoutStart;// = new Integer(0);
	private int sumPartWithoutEnd;// = new Integer(0);
	private int sumCtiInputOutOfRange; //=new Integer(0);
	private long sumNotInLogic=0;
	private int sumPartUpdate; // = new Integer(0);
	//private int processKey = 1; 

	//CONSTANT

	private int CtiPartBeforShiftStatus = 0;
	private int CtiInputBeforStatus = 0;
	private int CtiInputAfterStatus = 1;
	private int TempForWork = 10;
	private char newLine = 13;

	//private BatchCtiDocBean partDocBean;
	/**
	 * @param args
	 */
	public CTIProcess1Copy(String[] args) {
		super(args);
		
	}

	public static void main(String[] args) throws Exception {
		System.out.println( "START :" + new Date());
		System.out.println("args[0] = "+args[0]+", args[0] = "+args[1]);
		CTIProcess1Copy ctiProcess=new CTIProcess1Copy(args);
		ctiProcess.perform();
		System.out.println("END " + new Date());
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#createProcessBeanObject()
	 */
	protected Object createProcessBeanObject() {
		
		return null;
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#execute()
	 */
	public void execute() throws ShfException {
		fixDuplicate(); // double shifts from 199+166
		handleCtiInput();
		System.out.println("END - ALL");
	}
	
	private void fixDuplicate() throws ShfException {
		Vector recVec = null;
		recVec = getAllDuplicateRecs();
		if (recVec.size()>0 && (recVec != null)) {
			handleDuplicate(recVec);
		} else {
			tracerLogger.info("***** NO ROWS TO PROCESS - handleDuplicate ****");
		}		
	}

	private void handleCtiInput() throws ShfException {
		Vector recVec = null;
		recVec = getAllCtiRecordsToProcess();
		if (recVec.size()>0 && (recVec != null)) {
			buildCtiParts(recVec);
		} else {
			tracerLogger.info("***** NO ROWS TO PROCESS - buildCtiParts ****");
		}
	}

	private void handleDuplicate (Vector recVec) throws ShfException {
		System.out.println("recVec size : " + recVec.size());
		CtiInputBean ctiInput1 = null;
		CtiInputBean ctiInput2 = null;
		CtiInputBean ctiInput3 = null;
		for(int i=0;i<(recVec.size()-2);i++){
			ctiInput1 = (CtiInputBean)recVec.get(i);
			ctiInput2 = (CtiInputBean)recVec.get(i+1);
			ctiInput3 = (CtiInputBean)recVec.get(i+2);
			if ( (ctiInput3.getEmp_id().equals(ctiInput2.getEmp_id()) ) &&
				  ctiInput3.getCurrent_time().equals(ctiInput2.getCurrent_time()) &&
				  ctiInput1.getEmp_id().equals(ctiInput2.getEmp_id()) &&
				  ctiInput1.getStatus() == ctiInput2.getStatus()) {
				
				updateWeight(ctiInput3);
				recVec.set(i+1, ctiInput3);
				recVec.set(i+2, ctiInput2);
			}
		}
	}
	private void updateWeight(CtiInputBean ctiInput2) throws ShfException {
		System.out.println("updateWeight()");
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_BEFORE_HANDLED  ");
		sql.append(" SET STATUS_WEIGHT = ? "); // 1
		sql.append(" WHERE AGENTDBID = ? "); // 2
		sql.append(" AND CURRENT_TIME = ? "); // 3
		sql.append(" AND STATUS = ? "); // 4
		sql.append(" AND EMP_ID = ? "); // 5

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++,2); // 1
			getDbAccess().setLong(param_index++,ctiInput2.getAgentdbid()); // 2
			getDbAccess().setTimestamp(param_index++,ctiInput2.getCurrent_time()); // 3
			getDbAccess().setInt(param_index++,ctiInput2.getStatus()); // 4 
			getDbAccess().setString(param_index++,ctiInput2.getEmp_id()); // 5
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateWeight()", e);
		}
		
	}

	/**
	 * @param recVec
	 */
	private void buildCtiParts(Vector recVec) throws ShfException {
		System.out.println("buildCtiParts()");
		CtiInputBean ctiInput = null; //new CtiInputBean();
		CtiPartBean ctiParts = new CtiPartBean();
		
		Vector ctiInputForUpdateVec = new Vector();
		Vector ctiPartForUpdateVec = new Vector();
		
		boolean diffrentUser = true;  
		boolean firstRec = true; 
		String lastEmpId=null;
		String currEmpId=null;
		Date lastDate = null; 
		Date currDate = null;
		int lastStatus=2;
		int currStatus=2;
		long ctiPartId = 0;
		boolean restRecInRange = true;
		boolean lastRecInRange = true;
		
		ctiPartId = getNewCtiPartId();
		for(int i=0;i<recVec.size()/*&&i<TempForWork*/;i++){
			sumAllCTIInput++;
			ctiInput = (CtiInputBean)recVec.get(i);
//			if (ctiInput.getEmp_id().equals("30272357")) {
//					printCurrentRec(ctiInput);
//			} 
			currStatus = ctiInput.getStatus();
			
			if (firstRec) {
				lastEmpId = ctiInput.getEmp_id();
				currEmpId = ctiInput.getEmp_id();
				lastDate = ctiInput.getCurrent_time();
			} else {
				currDate = ctiInput.getCurrent_time();
				currEmpId = ctiInput.getEmp_id(); 
			}
			
			if ( !currEmpId.equals(lastEmpId)) { // נציג משתנה
				currEmpId = ctiInput.getEmp_id();
				diffrentUser = true;
				restRecInRange = true;	// במידה ורשומה מחוץ לטווח, כל הרשומות שאחריה לאותו המשתמש, לא יכנסו לעיבוד. 
				// כשמשתנה נציג, מתחילים בדיקה מחדש
			 } else {
			 	lastRecInRange = restRecInRange;
				diffrentUser = false;
			 }
			 
			if (restRecInRange) { // אם הרשומה האחרונה לאותו המשתמש מחוץ לטווח העיבוד, לא נכנסים לבדיקת הרשומה 

				if (ctiInput.getStatus() == ShfBatchConstants.CtiInputIN) { // כניסה
					  if (checkIfSameShift(lastDate, lastStatus, lastEmpId, ctiInput)) {
					  // בדיקה האם חורג מטווח העיבוד והאם שייך לאותה המשמרת עפ"י הקרוטריונים שהוגדרו
							if (firstRec) {
								//אם תנועה ראשונה 
								ctiParts.setEmp_id(ctiInput.getEmp_id());
								ctiParts.setCti_part_start(ctiInput.current_time);
								ctiInput.setCti_part_id(ctiPartId);
								ctiInputForUpdateVec.add(ctiInput);	
								sumPartUpdate++; // = new Integer(sumPartUpdate.intValue()+1);						
							} else 	if (diffrentUser) {
									//אם התחלף משתמש
									if (lastStatus == ShfBatchConstants.CtiInputIN && lastRecInRange){ // אם התנועה האחרונה של הנציג הקודם הייתה כניסה וגם בטווח של העיבוד אז מטפלים בה
										ctiParts.setCti_part_id(ctiPartId);
										ctiPartForUpdateVec.add(ctiParts);
										ctiPartId = getNewCtiPartId();
										sumPartWithoutEnd++; // = new Integer(sumPartWithoutEnd.intValue()+1);
									}
									ctiParts= new CtiPartBean();
									ctiParts.setEmp_id(ctiInput.getEmp_id());
									ctiParts.setCti_part_start(ctiInput.current_time);
									ctiInput.setCti_part_id(ctiPartId);
									ctiInputForUpdateVec.add(ctiInput);
									sumPartUpdate++; // = new Integer(sumPartUpdate.intValue()+1);
								} else 	if ( (lastStatus == ShfBatchConstants.CtiInputOUT) ) {
									  //אם התנועה הקודמת הייתה יציאה לאותו נציג
									  ctiParts= new CtiPartBean();
									  ctiParts.setEmp_id(ctiInput.getEmp_id());
									  ctiParts.setCti_part_start(ctiInput.current_time);
									  ctiInput.setCti_part_id(ctiPartId);
									  ctiInputForUpdateVec.add(ctiInput);
									  sumPartUpdate++; // = new Integer(sumPartUpdate.intValue()+1);
							    	} else 	if (lastStatus == ShfBatchConstants.CtiInputIN) {
										// אם סטאטוס קודם היה כניסה, כלומר כניסה לאחר כניסה לאותו נציג 
										if (restRecInRange) {
											//התנועה הקודמת תירשם רק במידה ולא חרגה מטווח הזמן לעיבוד
											ctiParts.setCti_part_id(ctiPartId);
											ctiPartForUpdateVec.add(ctiParts);
											ctiPartId = getNewCtiPartId();
											sumPartWithoutEnd++; // = new Integer(sumPartWithoutEnd.intValue()+1);
										} // until here
										ctiParts = new CtiPartBean();
										ctiParts.setEmp_id(ctiInput.getEmp_id());
										ctiParts.setCti_part_start(ctiInput.current_time);
										ctiInput.setCti_part_id(ctiPartId);
										ctiInputForUpdateVec.add(ctiInput);
										sumPartUpdate++; // = new Integer(sumPartUpdate.intValue()+1);
									} else { //אם קיים מצב שאינו נמצא בלוקיגה
										System.out.println("*******************************");
										System.out.println("******** NOT IN LOGIC *********");
										printCurrentRec(ctiInput);
										System.out.println("*******************************");
										tracerLogger.error(" NOT IN LOGIC -" + " emp_id : " + ctiInput.getEmp_id()+",  current time: " +ctiInput.getCurrent_time());
										sumNotInLogic++;
									}
						lastRecInRange = true;				
					} else { // checkIfSameShift
						restRecInRange = false; 
						lastRecInRange = false;
						System.out.println(" לא שייך לטווח - כניסה");
						printCurrentRec(ctiInput);
					}
	
				} else { // יציאה
					if (checkIfSameShift(lastDate, lastStatus, lastEmpId, ctiInput)) {
						if (firstRec) { //אם רשומה ראשונה
							ctiParts.setCti_part_end(ctiInput.getCurrent_time());
							ctiParts.setEmp_id(ctiInput.getEmp_id());
							ctiParts.setCti_part_id(ctiPartId);
							ctiPartForUpdateVec.add(ctiParts);
							sumPartWithoutStart++;
							ctiInput.setCti_part_id(ctiPartId);
							ctiInputForUpdateVec.add(ctiInput);
							ctiPartId = getNewCtiPartId();
							sumPartUpdate++;
							ctiParts= new CtiPartBean();
							
						} else	if (diffrentUser ) { // או האם התחלף הנציג
									if (lastStatus == ShfBatchConstants.CtiInputIN && lastRecInRange) { // אם התנועה האחרונה של הנציג הקודם הייתה כניסה וגם הייתה בטווח של העיבוד
										ctiParts.setCti_part_id(ctiPartId);
										ctiPartForUpdateVec.add(ctiParts);
										ctiPartId = getNewCtiPartId();
										sumPartWithoutEnd++; // = new Integer(sumPartWithoutEnd.intValue()+1);
									}
									
									ctiParts= new CtiPartBean();
									ctiParts.setCti_part_end(ctiInput.getCurrent_time());
									ctiParts.setEmp_id(ctiInput.getEmp_id());
									ctiParts.setCti_part_id(ctiPartId);
									ctiPartForUpdateVec.add(ctiParts);
									ctiInputForUpdateVec.add(ctiInput);
									ctiPartId = getNewCtiPartId();
									sumPartUpdate++; 
									sumPartWithoutStart++; 
									ctiParts= new CtiPartBean();
							} else 	if (lastStatus == ShfBatchConstants.CtiInputIN) { //  או האם התנועה האחרונה של הנציג הנוכחי הייתה כניסה
										ctiParts.setCti_part_end(ctiInput.getCurrent_time());
										ctiParts.setEmp_id(ctiInput.getEmp_id());
										ctiParts.setCti_part_id(ctiPartId);
										ctiPartForUpdateVec.add(ctiParts);
										ctiInput.setCti_part_id(ctiPartId);
										ctiInputForUpdateVec.add(ctiInput);
										
										ctiPartId = getNewCtiPartId();
										sumPartUpdate++; 
										ctiParts= new CtiPartBean();
										sumPart++; 
								} else	if (lastStatus == ShfBatchConstants.CtiInputOUT) { 
										//  או האם התנועה האחרונה של הנציג הייתה יציאה
										ctiParts= new CtiPartBean();
										ctiParts.setEmp_id(ctiInput.getEmp_id());
										ctiParts.setCti_part_end(ctiInput.getCurrent_time());
										ctiParts.setCti_part_id(ctiPartId);
										ctiPartForUpdateVec.add(ctiParts);
										ctiInput.setCti_part_id(ctiPartId);
										ctiInputForUpdateVec.add(ctiInput);
										
										ctiPartId = getNewCtiPartId();
										ctiParts= new CtiPartBean(); //for check 15.02.2010
										sumPartUpdate++; 
										if (ctiParts.cti_part_start == null) {
											
										}
										sumPartWithoutStart++; 
										ctiParts= new CtiPartBean();
									} else { // אם קיים מצב שאינו נמצא בלוקיגה
										System.out.println("*******************************");
										System.out.println("******** NOT IN LOGIC *********");
										printCurrentRec(ctiInput);
										System.out.println("*******************************");
										tracerLogger.error(" NOT IN LOGIC -" + " emp_id : " + ctiInput.getEmp_id()+",  current time: " +ctiInput.getCurrent_time());
										sumNotInLogic++;
									}
						lastRecInRange = true;			
					}	else { // checkIfSameShift
						restRecInRange = false;
						lastRecInRange = false;
						System.out.println("לא שייך לטווח - יציאה");
						printCurrentRec(ctiInput);
					}
	
				} // status = 0 - Exit
			} else { //if (restRecInRange) 
				System.out.println("המשך - לא שייך לטווח");
				printCurrentRec(ctiInput);
				sumCtiInputOutOfRange++; 
			}
			
			firstRec = false;
			lastDate = currDate;
			lastStatus=currStatus;
			lastEmpId = currEmpId;
		} // END - FOR LOOP
		
		if (currStatus==ShfBatchConstants.CtiInputIN && restRecInRange ) {
			ctiParts.setCti_part_id(ctiPartId);
			ctiPartForUpdateVec.add(ctiParts);
			sumPartWithoutEnd++; 
		}
		System.out.println("Last handled record :");
		printCurrentRec(ctiInput);
		tracerLogger.error("Last handled record : " + "emp_id : " + ctiInput.getEmp_id()+",  current time: " +ctiInput.getCurrent_time());
		System.out.println("*-*-*-*-*-*-*-*-*-*-*-*-*-*-**ctiInputForUpdateVec*-*-*-*-*-*-*-**-*-*-*-*-*-*-*-*-*-*-*-*-*-**-*-*-*-*-*-*-*-*-*-*-*-*-*-*");
		for (int ii=0; ii<ctiInputForUpdateVec.size();ii++) {
			updateBeforCtiStatus(CtiInputAfterStatus, ((CtiInputBean)ctiInputForUpdateVec.get(ii)));
			((CtiInputBean)ctiInputForUpdateVec.get(ii)).setHandle_status(CtiInputAfterStatus);
			insertAfterCti(((CtiInputBean)ctiInputForUpdateVec.get(ii)));
		}		
		for (int ii=0; ii<ctiPartForUpdateVec.size();ii++) {
			insertCtiParts(((CtiPartBean)ctiPartForUpdateVec.get(ii)));
		}
		
		System.out.println("END - getAllCtiShiftForReward()");
	}

	private long getNewCtiPartId() throws ShfException {
		long seq_id=0;
		System.out.println("getNewCtiPartId()");
		
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT SHIFTER.SHF_CTI_PART_ID.NEXTVAL FROM DUAL ");
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().executeQuery();
			getDbAccess().next();
			seq_id = getDbAccess().getLong(1);
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getNewCtiPartId", e);
		}
		
		return seq_id;
	}

	/**
	 * @param ctiInput
	 */
	private void printCurrentRec(CtiInputBean ctiInput) {
		System.out.println("printCurrentRec()");
		System.out.println(ctiInput.getEmp_id() + ";" + ctiInput.getCurrent_time()+";"+( ctiInput.getStatus()==1?"IN":"OUT" ));
		
	}

	/**
	 * @param bean
	 */
	private void insertAfterCti(CtiInputBean bean) throws ShfException {
		System.out.println("insertAfterCti()" + bean.getEmp_id() + bean.getCurrent_time());
		
		int param_index=1;
		StringBuffer sql=new StringBuffer();

		sql.append(" INSERT INTO SHIFTER.SHF_CTI_AFTER_HANDLED (AGENTDBID, CURRENT_TIME, EMP_ID,  ");
		sql.append("             HANDLE_STATUS, STATUS, CREATION_DATE, SOURCE, CTI_PART_ID, STATUS_WEIGHT ) ");
		sql.append(" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ");  

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setLong(param_index++,bean.getAgentdbid()); //AGENTDBID
			getDbAccess().setTimestamp(param_index++,bean.getCurrent_time()); //CURRENT_TIME
			getDbAccess().setString(param_index++,bean.getEmp_id()); //EMP_ID
			getDbAccess().setInt(param_index++,bean.getHandle_status()); //HANDLE_STATUS
			getDbAccess().setInt(param_index++,bean.getStatus()); //STATUS
			getDbAccess().setTimestamp(param_index++,bean.getCreation_date()); // CREATION_DATE
			getDbAccess().setString(param_index++,bean.getSource()); // SOURCE
			getDbAccess().setLong(param_index++,bean.getCti_part_id()); // CTI_PART_ID
			getDbAccess().setInt(param_index++,bean.getStatus_weight()); // STATUS_WEIGHT 
			
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("insertAfterCti() :", e);
		}
	}


	private boolean checkIfSameShift(Date lastDate, int lastStatus, String lastEmpId, CtiInputBean currInput) {
		System.out.println("checkIfSameShift()");
		//הפונקציה בודקת את כל התנועות שחורגות מטווח העיבוד - האם שייכות למשמרת שהתחילה בתוך טווח העיבוד
		boolean retVal = false;
		if ( (currInput.getCurrent_time().before(EndDateForProcess)) ) { // אם תנועה לא חורגת מטווח עיבוד, אין צורך בבדיקה בשלב זה
			retVal = true;
		} else {

//			 הבדיקה מתבצעת רק אם מדובר בנתונים של אותו הנציג כלומר - רק אם מדובר בתנועת המשך לאותו נציג שחורגת מטווח העיבוד
				 if ( currInput.getEmp_id().equals(lastEmpId) ) {
			
					 // אם יציאה לאחר כניסה ממשיכים טיפול
					 if ( (currInput.getStatus() == ShfBatchConstants.CtiInputOUT) && (lastStatus == ShfBatchConstants.CtiInputIN) ) {
						 retVal = true;
					 }
			
					 // אם אותו סוג החתמה וההפרש הוא קטן או שווה מהפרמטר לחיבור למשמרת אחת אז ממשיכים טיפול
					 if ( lastStatus == currInput.getStatus() && ( currInput.getCurrent_time().getTime() - lastDate.getTime() <=  Integer.parseInt(SHFParameters.getMaxDiffrentBetweenSameRecType(null).getValue()) *60*1000) ){  //ShfBatchConstants.MaxDiffrentBetweenSameRecType
						 retVal=true;
					 }
			
					 // אם כניסה לאחר יציאה בהפרש קטן או שווה מפרמטר הפרש מחייב אז ממשיכים טיפול 
					 if ( ((lastStatus == ShfBatchConstants.CtiInputOUT) && (currInput.getStatus() == ShfBatchConstants.CtiInputIN) )  && ( currInput.getCurrent_time().getTime() - lastDate.getTime() <= Integer.parseInt(SHFParameters.getBindingDifference(null).getValue()) *60*1000) ) { //ShfBatchConstants.BindingDifference
						 retVal=true;
					 }
				 }
		}
		if (!retVal) {
			System.out.println("-*-*-*- " + retVal + " -*-*-*-"); 
			sumCtiInputOutOfRange++; 
			} 		 
		return retVal;
	}

	/**
	 * @param ctiPartForUpdateVec
	 * @throws ShfException 
	 */
	private void insertCtiParts(CtiPartBean ctiPartForUpdateVec) throws ShfException {
		System.out.println("insertCtiParts()");
		printCurrentRec(ctiPartForUpdateVec);
		int param_index=1;
		long start_end_key = 0;
		StringBuffer sql=new StringBuffer();

		//חישוב שדה מפתח לטבלת המקטעים
		if (ctiPartForUpdateVec.getCti_part_start() == null) {
			start_end_key=0;
		} else {
			start_end_key=ctiPartForUpdateVec.getCti_part_start().getTime();
		}
		if (!(ctiPartForUpdateVec.getCti_part_end() == null)) {
			// אם התאריך סיום שונה מנאל, חשב אותו למפתח אחרת, נשאר רק החישוב של תאריך ההתחלה
			start_end_key = start_end_key + ctiPartForUpdateVec.getCti_part_end().getTime();
		}
		
		ctiPartForUpdateVec.setCti_start_end_key(start_end_key);

		sql.append(" INSERT INTO SHIFTER.SHF_CTI_PARTS (CTI_PART_START, EMP_ID, CTI_PART_END, CTI_PART_END_UPDATE, ");
		sql.append(" PROCESS_DATE, UPDATE_DATE, UPDATE_ID, HANDLE_STATUS, CTI_START_END_KEY, CTI_PART_ID)  "); 
		sql.append(" VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?) "); 
		// cti_part_start, emp_id, cti_part_end, cti_part_end_update, process_date, update_date, update_id,	handle_status, cti_start_end_key 

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setTimestamp(param_index++,ctiPartForUpdateVec.getCti_part_start()); //cti_part_start
//			System.out.println("ctiPartForUpdateVec.getCti_part_start() = " + ctiPartForUpdateVec.getCti_part_start());
			getDbAccess().setString(param_index++,ctiPartForUpdateVec.getEmp_id()); //emp_id
//			System.out.println("ctiPartForUpdateVec.getEmp_id() = " + ctiPartForUpdateVec.getEmp_id());
			getDbAccess().setTimestamp(param_index++,ctiPartForUpdateVec.getCti_part_end()); //cti_part_end
//			System.out.println("ctiPartForUpdateVec.getCti_part_end() = "+ ctiPartForUpdateVec.getCti_part_end());
			getDbAccess().setTimestamp(param_index++,new Date()); //process_date
			getDbAccess().setTimestamp(param_index++,new Date()); //update_date
			getDbAccess().setString(param_index++,ShfBatchConstants.SystemUserId); // update_id
			getDbAccess().setInt(param_index++,CtiPartBeforShiftStatus); //handle_status
			getDbAccess().setLong(param_index++,ctiPartForUpdateVec.getCti_start_end_key()); //cti_start_end_key
//			System.out.println("ctiPartForUpdateVec.getCti_start_end_key()= " + ctiPartForUpdateVec.getCti_start_end_key());
			getDbAccess().setLong(param_index++,ctiPartForUpdateVec.getCti_part_id()); //CTI_PART_ID
//			System.out.println("ctiPartForUpdateVec.getCti_part_id() = " + ctiPartForUpdateVec.getCti_part_id());
			
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("insertCtiParts()", e);
		}
		
	}

	/**
	 * @param ctiPartForUpdateVec
	 */
	private void printCurrentRec(CtiPartBean ctiPartForUpdateVec) {
		System.out.println(ctiPartForUpdateVec.getEmp_id() + ";" + ctiPartForUpdateVec.getCti_part_start() + ";" + ctiPartForUpdateVec.getCti_part_end());
		
	}

	private void checkDB(){
		StringBuffer sql=new StringBuffer();
		sql.append("select e.FIRST_NAME from SHIFTER.SHF_EMPLOYEES e where e.EMP_ID_NUMBER = ? ");
		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setString(1,"029644374");
			getDbAccess().executeQuery();
			getDbAccess().next();
			System.out.println("========= "+getDbAccess().getString(1)+" ==============");
		}catch(DBException e){
			e.printStackTrace();
		}
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#finishProcess()
	 */
	
	protected void finishProcess() throws ShfException  {
		char newLine = 13;
		String str;
		Integer sumHandled = new Integer( (sumPart*2) + sumPartWithoutEnd + sumPartWithoutStart + sumCtiInputOutOfRange );
		Integer sumAllParts = new Integer(sumPart + sumPartWithoutStart + sumPartWithoutEnd);
		ctiDocBean.setStartProcessDate(LastProcessDate);
		ctiDocBean.setEndProcessDate(EndDateForProcess);
		ctiDocBean.setRecordsScanned(new Integer(sumAllCTIInput));
		ctiDocBean.setRecordsAdded(sumAllParts);
		ctiDocBean.setSapReqId(0);
		ctiDocBean.setP1PartNoStart(sumPartWithoutStart);
		ctiDocBean.setP1PartNoEnd(sumPartWithoutEnd);
		
		try {
			//insertDocs(processKey,EndDateForProcess, 1, sumAllCTIInput,sumAllParts, LastProcessDate, EndDateForProcess, partDocBean);
			insertDocs(ctiDocBean);
		}catch (Exception e) {
			e.printStackTrace();
			throw new ShfException(e.getMessage());
		}
		str = "" + newLine;
		tracerLogger.info(str);
		str = " -*-*-*-*-*-*-* SUMERY FOR CTI-INPUT TO PART *-*-*-*-*-*-*-*-" + newLine;
		tracerLogger.info(str);
		str = "LastProcessDate = " + LastProcessDate + "   EndDateForProcess = " + EndDateForProcess  + newLine;
		tracerLogger.info(str);
		str = "sumAllCTIInput : " + sumAllCTIInput + newLine;
		tracerLogger.info(str);
		str = "sumPart : " + sumPart + newLine;
		tracerLogger.info(str);
		str = "sumPartWithoutEnd : " + sumPartWithoutEnd + newLine;
		tracerLogger.info(str);
		str = "sumPartWithoutStart : " + sumPartWithoutStart + newLine;
		tracerLogger.info(str);
		str = "sumCtiInputOutOfRange : " + sumCtiInputOutOfRange + newLine;
		tracerLogger.info(str);
		str = "sumNotInLogic : " + sumNotInLogic  + newLine;
		tracerLogger.info(str);
		str = "sumPartUpdate : " + sumAllParts + newLine;
		tracerLogger.info(str);
		str = "SUM REC HANDLED : " + sumHandled  + newLine;
		tracerLogger.info(str);
		/////////////
		
		
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#initProcess()
	 */
	protected void initProcess() throws Exception {
		AppResources.getInstance().setTablesContainer(ShfBatchConstants.tc);
		loadSystemParam();
		// להעלות משתנים לזיכרון מהDB
		
//		partDocBean= new BatchCtiDocBean(batchDocBean); 
		
		
		LastProcessDate = getLastRunDate();
		EndDateForProcess = getEndTimeToProcess();
		
		//Add the logic parameters
		System.out.println(" -*-*-*-*-*-*-* PARAMETERS *-*-*-*-*-*-*-*-");
		tracerLogger.info(" -*-*-*-*-*-*-* PARAMETERS *-*-*-*-*-*-*-*- " + newLine);
		
		System.out.println("LastProcessDate = " + LastProcessDate + "   EndDateForProcess = " + EndDateForProcess  );
		tracerLogger.info("LastProcessDate = " + LastProcessDate + "   EndDateForProcess = " + EndDateForProcess + newLine);
		
		System.out.println("bindingDifference  = " +  Integer.parseInt(SHFParameters.getBindingDifference(null).getValue()) );
		tracerLogger.info("bindingDifference  = " + Integer.parseInt(SHFParameters.getBindingDifference(null).getValue()) + newLine);
		
		System.out.println("maxDiffrentBetweenShfAndCti = " +  Integer.parseInt(SHFParameters.getMaxDiffrentBetweenShfAndCti(null).getValue()) );
		tracerLogger.info("maxDiffrentBetweenShfAndCti = " + Integer.parseInt(SHFParameters.getMaxDiffrentBetweenShfAndCti(null).getValue())+ newLine);
		
		System.out.println("maxDiffrentBetweenSameRecType = " +  Integer.parseInt(SHFParameters.getMaxDiffrentBetweenSameRecType(null).getValue()) ); 
		tracerLogger.info("maxDiffrentBetweenSameRecType = " +  Integer.parseInt(SHFParameters.getMaxDiffrentBetweenSameRecType(null).getValue()) + newLine);
		
		System.out.println("maxCtiShiftLength  = "+ Integer.parseInt(SHFParameters.getMaxCtiShiftLength(null).getValue()) );
		tracerLogger.info("maxCtiShiftLength  = "+ Integer.parseInt(SHFParameters.getMaxCtiShiftLength(null).getValue()) + newLine);
		System.out.println(" -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-");
		tracerLogger.info(" -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*- " + newLine);
	}

	/* (non-Javadoc)
	 * @see bzq.shf.batch.BaseBatchProcess#initProcessArguments()
	 */
	protected void initProcessArguments() throws Exception {
	}

	public Vector getAllDuplicateRecs() throws ShfException {
		System.out.println("getAllDuplicateRecs()");
		Vector recs = new Vector();
		int param_index=1;

		StringBuffer sql=new StringBuffer();
		sql.append(" SELECT C.AGENTDBID, C.CURRENT_TIME, C.STATUS, C.STATUS_WEIGHT ,C.EMP_ID, C.CREATION_DATE, C.HANDLE_STATUS, C.SOURCE  FROM SHIFTER.SHF_CTI_BEFORE_HANDLED C, SHIFTER.SHF_EMPLOYEES E  ");
		sql.append(" WHERE C.AGENTDBID IN (SELECT T.AGENTDBID ");
		sql.append("  					     FROM SHIFTER.SHF_CTI_BEFORE_HANDLED T	");
		sql.append(" 						WHERE T.HANDLE_STATUS = ? "); // 1
		sql.append("  						  AND T.CURRENT_TIME >  ?	"); // 2
		sql.append(" 					   HAVING COUNT(T.AGENTDBID) > 1 ");
		sql.append("  						GROUP BY(T.AGENTDBID, T.CURRENT_TIME, T.EMP_ID) ) ");
		sql.append("  AND SUBSTR(E.EMP_ID_NUMBER,1,8) = C.EMP_ID ");
		sql.append("  AND C.HANDLE_STATUS = ? "); // 3 
		sql.append("  AND C.CURRENT_TIME >  ? "); // 4
		sql.append(" ORDER BY C.EMP_ID, C.CURRENT_TIME, C.STATUS + C.STATUS_WEIGHT DESC ");
		
		try{
			System.out.println("LastProcessDate : "+LastProcessDate);
			CtiInputBean ctiBean;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++, CtiInputBeforStatus); // 1
			getDbAccess().setTimestamp(param_index++, LastProcessDate); // 2
			getDbAccess().setInt(param_index++, CtiInputBeforStatus); // 3
			getDbAccess().setTimestamp(param_index++, LastProcessDate); // 4 
			getDbAccess().executeQuery();
			while(getDbAccess().next() ){
				ctiBean=new CtiInputBean();
				getDbAccess().populate(ctiBean);
				recs.add(ctiBean);
			}
		} catch (DBQueryNoRowsException en) {
			System.out.println("getAllDuplicateRecs() : no rows to process");
			tracerLogger.info("getAllDuplicateRecs() : no rows to process", en);
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getAllDuplicateRecs()" + e);
		}
		System.out.println("end success getAllDuplicateRecs()");
		return recs;
	}	
	
	public Vector<CtiInputBean> getAllCtiRecordsToProcess() throws ShfException {
		System.out.println("getAllCtiRecordsToProcess()");
		Vector<CtiInputBean> recs = new Vector<CtiInputBean>();
//		Date endDate = null;// new Date();	//	Muted since not used
//		Date lastDate = null; //new Date();	//	Muted since not used
		int param_index=1;		
		 
//		lastDate = getLastRunDate();		//	Muted since not used
//		endDate = getEndTimeToProcess();	//	Muted since not used
		
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT AGENTDBID, CURRENT_TIME, STATUS, EMP_ID, CREATION_DATE, HANDLE_STATUS, SOURCE " );		sql.append("  FROM SHIFTER.SHF_CTI_BEFORE_HANDLED, SHIFTER.SHF_EMPLOYEES E ");
		sql.append(" WHERE CURRENT_TIME >= ? ");
		sql.append("   AND HANDLE_STATUS = ? "); 
		sql.append("   AND  EMP_ID = SUBSTR(E.EMP_ID_NUMBER, 1, 8) ");
		sql.append(" ORDER BY EMP_ID, CURRENT_TIME , (STATUS + STATUS_WEIGHT) DESC");
		
		try{
			CtiInputBean ctiBean;
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setTimestamp(param_index++, LastProcessDate);
			getDbAccess().setInt(param_index++, CtiInputBeforStatus);
			getDbAccess().executeQuery();
//			int temp=0;		//	Muted since not used
			while(getDbAccess().next()/* && temp++<TempForWork*/ ){
				ctiBean=new CtiInputBean();
				getDbAccess().populate(ctiBean);
				recs.add(ctiBean);
			}
		} catch (DBQueryNoRowsException en) {
			tracerLogger.info("getAllCtiRecordsToProcess() : no rows to process", en);
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("getAllCtiRecordsToProcess()" + e);
		}
		
		return recs;
	}

	/**
	 * @param i
	 * @param ctiInputForUpdateVec
	 */
	private void updateBeforCtiStatus(int handle_status, CtiInputBean ctiInputForUpdateVec) throws ShfException {
		System.out.println("updateBeforCtiStatus()");
		int param_index=1;
		
		StringBuffer sql=new StringBuffer();
		sql.append(" UPDATE SHIFTER.SHF_CTI_BEFORE_HANDLED  ");
		sql.append(" SET HANDLE_STATUS = ? , CTI_PART_ID = ? "); // 1
		sql.append(" WHERE AGENTDBID = ? "); // 2
		sql.append(" AND CURRENT_TIME = ? "); // 3
		sql.append(" AND STATUS = ? "); // 4
		sql.append(" AND EMP_ID = ? "); // 5

		try{
			getDbAccess().prepareStatement(sql.toString());
			getDbAccess().setInt(param_index++,handle_status); // 1
			getDbAccess().setLong(param_index++,ctiInputForUpdateVec.getCti_part_id()); // 1
			getDbAccess().setLong(param_index++,ctiInputForUpdateVec.getAgentdbid()); // 2
			getDbAccess().setTimestamp(param_index++,ctiInputForUpdateVec.getCurrent_time()); // 3
			getDbAccess().setInt(param_index++,ctiInputForUpdateVec.getStatus()); // 4 
			getDbAccess().setString(param_index++,ctiInputForUpdateVec.getEmp_id()); // 5
			getDbAccess().executeUpdate();
		}catch(DBException e){
			e.printStackTrace();
			throw new ShfException("updateBeforCtiStatus()", e);
		}
		
	}
	
	public Date getEndTimeToProcess() {
		System.out.println("getEndTimeToProcess()");
		Date endDate = null; //new Date();
		Calendar cal = Calendar.getInstance();
		
		cal.add(Calendar.HOUR_OF_DAY, - (Integer.parseInt(SHFParameters.getSaftyRangForProcess(null).getValue())) );
		endDate = cal.getTime();
		return endDate;
	}
}
