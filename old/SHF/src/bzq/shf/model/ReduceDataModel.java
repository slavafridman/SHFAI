/*
 * Created on 13/07/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;

import java.util.Calendar;
import java.util.Date;
import java.util.StringTokenizer;
import java.util.Vector;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.dao.ReplaceMassageDao;
import bzq.shf.forms.ShiftDataForm;
import bzq.shf.forms.ShiftReduceListForm;
import bzq.shf.forms.ShiftReduceRequestForm;
import bzq.shf.transfer.ReplaceMassage;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.ShfException;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReduceDataModel {
	private static Logger logger = Logger.getLogger(BreakDataModel.class);
	
	public ReduceDataModel() {
		
	}
	
	public void setRequestCurrentDefaults(ShiftReduceRequestForm form) {
		logger.debug("Starting setRequestCurrentDefaults()");
		
		Calendar cal=Calendar.getInstance();
		int m=cal.get(Calendar.MINUTE);
		int h=cal.get(Calendar.HOUR_OF_DAY);
		cal.getTime();
		String hour = String.valueOf(cal.get(Calendar.HOUR_OF_DAY));
		hour=(cal.get(Calendar.HOUR_OF_DAY)<10)?"0"+hour:hour;
		((ShiftReduceRequestForm)form).setTime(hour + ":00");
		((ShiftReduceRequestForm)form).setDate(cal.getTime());
	}
	
	public void setRequestInsertDefaults(ShiftReduceRequestForm form) {
		logger.debug("Starting setRequestInsertDefaults()");
		((ShiftReduceRequestForm)form).setDate(new Date());
		if ((form.getAllowedMoked()!=null) && !(form.getAllowedMoked().length() == 0) ) {
			((ShiftReduceRequestForm)form).setMokedId(form.getAllowedMoked());
		}
	}
	
	public Vector populateReduceRequest(ShiftReduceRequestForm form) throws ShfException {
		logger.debug("starting populateReduceRequest()");
		Vector retVec = null;
		
		StringBuffer sSql = new StringBuffer();
		//String moked = SHFTableUtils.getMokedCodeOf();
		int param_index=1;
		
		sSql.append(" SELECT * FROM SHIFTER.SHF_SHIFT_REDUCE_REQ ");		sSql.append(" WHERE MOKED_ID in( ");
		for(int i=0;i<form.getAllowedUnits().size();i++){
			sSql.append(form.getAllowedUnits().get(i));
			if(i<form.getAllowedUnits().size()-1)
				sSql.append(",");
		}
		sSql.append(")");
		sSql.append(" AND SHIFT_START > ? ");
		sSql.append(" ORDER BY SHIFT_START ");

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			//dBAccess.setString(param_index++, form.getAllowedMoked());
			dBAccess.setTimestamp(param_index++, new Date());
			dBAccess.executeQuery();
			ShiftReduceRequestForm reduceReqForm = null;
			retVec=new Vector();
			dBAccess.populate("bzq.shf.forms.ShiftReduceRequestForm",retVec);

			
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in populateReduceRequest(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateReduceRequest() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return retVec;
	}


	public void populateAddRequestReduce(ShiftReduceRequestForm form) throws ShfException {
		logger.debug("starting populateAddRequestReduce()");
		
		Vector retVec = null;
		StringBuffer sSql = new StringBuffer();
		int param_index=1;
		
		sSql.append(" SELECT R.*, D.*, Q.*, E.* ");
		sSql.append(" FROM SHIFTER.SHF_SHIFT_REDUCE_REQ Q ");
		sSql.append(" LEFT JOIN SHIFTER.SHF_SHIFT_REDUCE_CANDIDATE R ON Q.SHIFT_REDUCE_ID = R.SHIFT_REDUCE_ID "); 
		sSql.append(" LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY D ON R.SHF_EMPLOYEE_DAY_ID = D.SHF_EMPLOYEE_DAY_ID ");
		sSql.append(" LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON D.SHF_EMPLOYEE_DAY_ID = C.SHF_EMPLOYEE_DAY_ID ");
		sSql.append(" LEFT JOIN SHIFTER.SHF_EMPLOYEES E ON R.AGENT_ID = SUBSTR(E.EMP_ID_NUMBER,1,8) ");
		sSql.append(" WHERE R.SHIFT_REDUCE_ID = ? ");

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			dBAccess.setLong(param_index++, form.getReduceId());
			dBAccess.executeQuery();
			Vector reduceList=new Vector();
			dBAccess.populate("bzq.shf.forms.ShiftReduceListForm",reduceList);
			form.setReduceList((ShiftReduceListForm[])reduceList.toArray(new ShiftReduceListForm[reduceList.size()]));
				
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in populateAddRequestReduce(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateAddRequestReduce() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}

	public void populateToReduce(ShiftReduceRequestForm form) throws ShfException{
		logger.debug("starting populateToReduce()");
		
		String startTime;
		Date  startDateTime=null;
		String endTime;
		Date EndDateTime=null;
		StringTokenizer st=null;
		int i=0;
		String dateStr=BaseConvert.dateToString(form.getDate(), "dd/MM/yyyy");
		try {
			startTime = BaseConvert.dateToString(form.getShiftStart(),"HH:mm");
			endTime = BaseConvert.dateToString(form.getShiftEnd(), "HH:mm");
	
			startDateTime = BaseConvert.stringToDate(dateStr + " " + startTime, "dd/MM/yyyy HH:mm");
			EndDateTime = BaseConvert.stringToDate(dateStr + " " + endTime, "dd/MM/yyyy HH:mm");

		} catch (ConvertException e1) {
			e1.printStackTrace();
		}
		
		StringBuffer sSql = new StringBuffer();
		int param_index=1;
		
		sSql.append(" SELECT D.*, "); 
		sSql.append("c.NEW_ACTIVITY, ");
		sSql.append("c.NEW_DAY_END, ");
		sSql.append("c.NEW_DAY_START, ");
		sSql.append("c.NEW_DAY_TYPE, ");
		sSql.append("c.NEW_EMPLOYEE_ID, ");
		sSql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sSql.append("c.NEW_PAID_MINUTES, ");
		sSql.append("c.NEW_SHIFT_END, ");
		sSql.append("c.NEW_SHIFT_START, ");
		sSql.append("c.NEW_SITE_ID, ");
		sSql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sSql.append("c.NEW_WORK_MINUTES, ");
		sSql.append("c.START_CHANGE_REASON, ");
		sSql.append("c.END_CHANGE_REASON, ");
		sSql.append("c.SWITCH_DAY_ID, ");
		sSql.append("c.MODIFICATION_TIME, ");
		sSql.append("c.MODIFICATION_USER, ");
		
		sSql.append("E.EMPLOYEE_ID, ");
		sSql.append("E.LAST_NAME, ");
		sSql.append("E.FIRST_NAME, ");
		sSql.append("E.JOB_ID, ");
		sSql.append("E.ORG_UNIT_ID ");
		
		sSql.append(" FROM SHIFTER.SHF_EMPLOYEE_DAY D "); 
		sSql.append(" LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON D.SHF_EMPLOYEE_DAY_ID = C.SHF_EMPLOYEE_DAY_ID ");
		sSql.append(" LEFT JOIN SHIFTER.SHF_EMPLOYEES E ON NVL(C.NEW_EMPLOYEE_ID, D.EMP_ID_NUMBER) = SUBSTR(E.EMP_ID_NUMBER,1,8) ");
		sSql.append(" WHERE ? = NVL(C.NEW_SHIFT_START, D.WM_SHIFT_START_DATETIME) ");
		sSql.append(" AND ? = NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME) ");
		sSql.append(" AND ? = replace(NVL(C.NEW_ACTIVITY, D.WM_SCH_ACTIVITY_ID_DATA),';','') ");
		sSql.append(" AND NVL(C.NEW_DAY_TYPE,D.WM_DAY_TYPE) = ?  ");
		sSql.append(" AND D.SHF_EMPLOYEE_DAY_ID NOT IN ( SELECT CD.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_SHIFT_REDUCE_CANDIDATE CD WHERE CD.SHIFT_REDUCE_ID = ?) ");
		
		if (form.getSelectedExceptions() != null ) {
			st = new StringTokenizer(form.getSelectedExceptions(),";");		
			i=st.countTokens();	
			sSql.append("AND ( "); 
			while (i-->0) {
				sSql.append(" ( (?) IN (SELECT EE.EXCEPTION_TYPE ");
				sSql.append(" FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS EE "); 
				sSql.append("WHERE EE.AGENT_DAY_ID = D.SHF_EMPLOYEE_DAY_ID AND EE.STATE_TYPE <> 4 AND EE.STATE_TYPE <> (-1)) ) ");
				if (i>0) sSql.append(" OR ");
			}
			sSql.append("  ) ");
		}

		DBAccess dBAccess=null;
		
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			dBAccess.setTimestamp(param_index++, startDateTime);
			dBAccess.setTimestamp(param_index++, EndDateTime);
			dBAccess.setString(param_index++, form.getActivity());
			dBAccess.setInt(param_index++, SHFConstants.DAY_TYPE_ACTIVITY);
			dBAccess.setLong(param_index++, form.getReduceId());
			if (form.getSelectedExceptions() != null && !(" ".equals(form.getSelectedExceptions()) ) ) {			
				while (st.hasMoreTokens()) {
					dBAccess.setString(param_index++, st.nextToken());
				}
			}
			dBAccess.executeQuery();
			Vector reqList=new Vector();
			//Vector reqListTemp=new Vector();
			dBAccess.populate("bzq.shf.forms.ShiftReduceListForm",reqList);
			/*for (int ii=0; ii<reqList.size();ii++) {
				if (SHFTableUtils.isActivitiesEquals((
					(ShiftReduceListForm)reqList.get(ii)).getActivity(), form.getActivity())){
					reqListTemp.add(reqList.get(ii));
				}
			}*/
			form.setReduceList((ShiftReduceListForm[])reqList.toArray(new ShiftReduceListForm[reqList.size()]));
			
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in populateToReduce(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in populateToReduce() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}

	public void searchReduceOptions(ShiftReduceRequestForm form, ShiftReduceRequestForm screenForm) throws ShfException {

		logger.debug("starting searchReduceOptions()");
		StringBuffer sSql = new StringBuffer();
		int i=0;
		StringTokenizer st = null;
		int param_index=1;

		sSql.append(" SELECT R.*, D.*, "); 
		sSql.append("c.NEW_ACTIVITY, ");
		sSql.append("c.NEW_DAY_END, ");
		sSql.append("c.NEW_DAY_START, ");
		sSql.append("c.NEW_DAY_TYPE, ");
		sSql.append("c.NEW_EMPLOYEE_ID, ");
		sSql.append("c.NEW_EXCEPTION_TYPE_ID, ");
		sSql.append("c.NEW_PAID_MINUTES, ");
		sSql.append("c.NEW_SHIFT_END, ");
		sSql.append("c.NEW_SHIFT_START, ");
		sSql.append("c.NEW_SITE_ID, ");
		sSql.append("c.NEW_TIMEOFF_TYPE_ID, ");
		sSql.append("c.NEW_WORK_MINUTES, ");
		sSql.append("c.START_CHANGE_REASON, ");
		sSql.append("c.END_CHANGE_REASON, ");
		sSql.append("c.SWITCH_DAY_ID, ");
		sSql.append("c.MODIFICATION_TIME, ");
		sSql.append("c.MODIFICATION_USER, ");
				
		sSql.append("E.EMPLOYEE_ID, ");
		sSql.append("E.LAST_NAME, ");
		sSql.append("E.FIRST_NAME, ");
		sSql.append("E.JOB_ID, ");
		sSql.append("E.ORG_UNIT_ID ");
		sSql.append(" FROM SHIFTER.SHF_EMPLOYEE_DAY D "); 
		sSql.append(" LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON D.SHF_EMPLOYEE_DAY_ID = C.SHF_EMPLOYEE_DAY_ID "); 
		sSql.append(" LEFT JOIN SHIFTER.SHF_SHIFT_REDUCE_CANDIDATE R ON D.SHF_EMPLOYEE_DAY_ID = R.SHF_EMPLOYEE_DAY_ID ");
		sSql.append(" LEFT JOIN SHIFTER.SHF_EMPLOYEES E ON NVL(R.AGENT_ID, NVL(C.NEW_EMPLOYEE_ID, D.EMP_ID_NUMBER)) = SUBSTR(E.EMP_ID_NUMBER,1,8) ");
		sSql.append(" WHERE  ( (NVL(C.NEW_DAY_TYPE,D.WM_DAY_TYPE) = ?) OR (R.APPROVE_TIME IS NOT NULL)  ) ");  //1
		sSql.append(" AND ? = NVL(C.NEW_SHIFT_START, D.WM_SHIFT_START_DATETIME) "); //2
		sSql.append(" AND ? = NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME) "); //3
		sSql.append(" AND ? = replace(NVL(C.NEW_ACTIVITY, D.WM_SCH_ACTIVITY_ID_DATA),';','') "); //4
		//sSql.append(" AND D.SHF_EMPLOYEE_DAY_ID NOT IN ( SELECT CD.SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_SHIFT_REDUCE_CANDIDATE CD) "); 
		sSql.append(" AND NVL(R.AGENT_ID, NVL(C.NEW_EMPLOYEE_ID, D.EMP_ID_NUMBER)) = ?  "); // 5 CURRENT USER ID
		
		if (form.getSelectedExceptions() != null ) {
			st = new StringTokenizer(form.getSelectedExceptions(), ";");
			i=st.countTokens();
			sSql.append("AND ( ");
			while (i-->0) {
				sSql.append(" ( (?) IN (SELECT EE.EXCEPTION_TYPE ");
				sSql.append(" FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS EE "); 
				sSql.append("WHERE EE.AGENT_DAY_ID = D.SHF_EMPLOYEE_DAY_ID AND EE.STATE_TYPE <> 4 AND EE.STATE_TYPE <> (-1)) ) ");
				if (i>0) sSql.append(" OR ");
			}
			sSql.append(" ) ");
		}

		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sSql.toString());
			dBAccess.setInt(param_index++, SHFConstants.DAY_TYPE_ACTIVITY); // 1 
			dBAccess.setTimestamp(param_index++, form.getShiftStart()); //2
			dBAccess.setTimestamp(param_index++, form.getShiftEnd()); //3
			dBAccess.setString(param_index++, form.getActivity()); //4
			dBAccess.setString(param_index++, screenForm.getUserId().substring(0,8)); // 5

			if ((form.getSelectedExceptions() != null)) {
				while ( st.hasMoreTokens()) {
					dBAccess.setString(param_index++, st.nextToken());
				}
			}
			
			dBAccess.executeQuery();
			Vector reqList=new Vector();
			//Vector reqListTemp=new Vector();
			
			dBAccess.populate("bzq.shf.forms.ShiftReduceListForm",reqList);
			
			/*for (int ii=0; ii<reqList.size();ii++) {
				if (SHFTableUtils.isActivitiesEquals((
					(ShiftReduceListForm)reqList.get(ii)).getActivity(), form.getActivity())){
					reqListTemp.add(reqList.get(ii));
				}
			}*/
			form.setReduceList((ShiftReduceListForm[])reqList.toArray(new ShiftReduceListForm[reqList.size()]));
			
		} catch(DBQueryNoRowsException e){
	
		} catch (DBException e) {
			logger.error("error in searchReduceOptions(): "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("error in searchReduceOptions() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	
	public void checkTimeForReduceShift(ShiftReduceListForm form) throws ShfException {
		logger.debug("Starting checkTimeForReduceShift() dayId = ");
		
		Date startDate=null;	
		startDate=form.getDate();
			
		//System.out.println("Time between (in minutes) ): " + (startDate.getTime() - new Date().getTime())/(1000*60));
		String moked = form.getAllowedMoked();
		String minuteS = SHFParameters.getMinutesBeforeReduceRequest(moked).getValue();
		long minutesL = Long.parseLong(minuteS);
		if ((startDate.getTime() - new Date().getTime())/(1000*60) < minutesL) {
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.timeBforReduce", null));					
			throw new ShfException(actionErrors);	
		}				
	}
	
	public void checkIfAllowedCancelShiftForReduce(ShiftReduceListForm form) throws ShfException {
		logger.debug("Starting checkIfAllowedCancelShiftForReduce() dayId = " + form.getAgentDayId());
		
		checkTimeForReduceShift(form); //throws exception if not alowed to cancel
		
		ShiftDataForm shiftForm = new ShiftDataForm();
		shiftForm.setAgentDayId(((AgentDayBean)form).getAgentDayId());
		ShiftDataModel shiftModel = new ShiftDataModel(shiftForm);
		shiftModel.checkShiftForCancel();  //throws exception if not alowed to cancel
	}
	
	public void cancelShiftForReduce(ShiftReduceListForm form) throws ShfException {
		logger.debug("Starting cancelShiftForReduce() dayId = " + form.getAgentDayId());
		
		ShiftDataForm shiftForm = new ShiftDataForm();
		shiftForm.setUserFirstName(form.getUserFirstName());
		shiftForm.setUserLastName(form.getUserLastName());
		shiftForm.setAgentDayId(((AgentDayBean)form).getAgentDayId());
		//shiftForm.setCancelReasonRemark("תחסור");
		shiftForm.setModificationTime(new Date());
		shiftForm.setModificationUser(form.getUserFirstName()+" "+form.getUserLastName());
		
		ShiftDataModel shiftModel = new ShiftDataModel(shiftForm);
		shiftModel.checkShiftForCancel();	
		shiftModel.cancelShift(); //throws exception if not alowed to cancel

		approveReduce(form);
	}

	private void approveReduce(ShiftReduceListForm form) throws ShfException {
		logger.debug("Starting approveReduce() dayId = " + form.getAgentDayId());

		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
				try {
					param = 1;
					StringBuffer sql = new StringBuffer();
					sql.append("UPDATE SHIFTER.SHF_SHIFT_REDUCE_CANDIDATE  ");
					sql.append("SET APPROVE_TIME = ? ");
					sql.append("WHERE SHF_EMPLOYEE_DAY_ID = ? ");
					
					db.prepareStatement(sql.toString());
					db.setTimestamp(param++, new Date());
					db.setLong(param++,form.getAgentDayId());
					db.executeUpdate();

			}catch (DBUpdateNoRowsException e) {
				
			}

		} catch (DBException e) {
			logger.error("error in approveReduce() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in approveReduce() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in approveReduce() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}		
		
	}


	public void addReduceCandidate(ShiftReduceListForm form) throws ShfException {
		logger.debug("Starting addReduceCandidate() dayId = " + form.getAgentDayId());

		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
				try {
					param = 1;
					StringBuffer sql = new StringBuffer();
					sql.append("INSERT INTO SHIFTER.SHF_SHIFT_REDUCE_CANDIDATE ");
					sql.append("(SHF_EMPLOYEE_DAY_ID, SHIFT_REDUCE_ID, AGENT_ID, ");
					sql.append("APPROVE_TIME, CREATION_TIME, MODIFICATION_TIME, MODIFICATION_USER) ");
					sql.append("VALUES (?, ?, ?, ?, ?, ?, ?) "); 
					

					db.prepareStatement(sql.toString());
					db.setLong(param++,form.getAgentDayId());
					db.setLong(param++,form.getReduceId());
					db.setString(param++,form.getEmpIdNumber());
					db.setTimestamp(param++,null);
					db.setTimestamp(param++,new Date());
					db.setTimestamp(param++,new Date());
					db.setString(param++,form.getUserId());
					db.executeUpdate();

			}catch (DBUpdateNoRowsException e) {
				
			}
		 
		} catch (DBException e) {
			logger.error("error in addReduceCandidate() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in addReduceCandidate() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in addReduceCandidate() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}

	public void declineReduce(ShiftReduceListForm form) throws ShfException {
		logger.debug("Starting declineReduce() dayId = " + form.getAgentDayId());

		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
				try {
					param = 1;
					StringBuffer sql = new StringBuffer();
					sql.append("DELETE SHIFTER.SHF_SHIFT_REDUCE_CANDIDATE ");
					sql.append("WHERE SHF_EMPLOYEE_DAY_ID = ? ");
					
					db.prepareStatement(sql.toString());
					db.setLong(param++,form.getAgentDayId());
					db.executeUpdate();

			}catch (DBUpdateNoRowsException e) {
				
			}
		} catch (DBException e) {
			logger.error("error in declineReduce() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in declineReduce() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in declineReduce() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}
	
	public void writeMassageForReduce(ShiftReduceListForm form, int messageType) throws ShfException{
		logger.debug("Starting writeMassageForReduce()");
		ReplaceMassage repMessage = new ReplaceMassage();
		ReplaceMassageDao  repMessageDao = new ReplaceMassageDao();
		String messageBody = new String();
		String startDateTime = null;
		String endDateTime = null;

		startDateTime =  (form.getStartTime()==null?BaseConvert.dateToString(form.getShiftStart(), "HH:mm" ):form.getStartTime()) + " " + BaseConvert.dateToString(form.getDate(),"dd/MM/yyyy");
		endDateTime = (form.getEndTime()==null?BaseConvert.dateToString(form.getShiftEnd(), "HH:mm"):form.getEndTime()) + " " + BaseConvert.dateToString(form.getDate(),"dd/MM/yyyy");
		
		switch (messageType){
			case SHFConstants.APPROVE_REDUCE:
					repMessage.setSubject("אישור בקשת צמצום משמרת");
					messageBody = messageBody + " בקשתך לצמצום משמרת המתחילה ב : ";
					messageBody = messageBody +  startDateTime;
					messageBody = messageBody +  " ומסתיימת ב ";
					messageBody = messageBody +  endDateTime;
					messageBody = messageBody +  " אושרה";
					break;
			
			case SHFConstants.DECLINE_REDUCE:
					repMessage.setSubject("דחיית בקשת לצמצום משמרת");
					messageBody = messageBody + " בקשתך לצמצום משמרת המתחילה ב : ";
					messageBody = messageBody +  startDateTime;
					messageBody = messageBody +  " ומסתיימת ב ";
					messageBody = messageBody +  endDateTime;
					messageBody = messageBody +  " נדחתה";
					break;
		}
			

		repMessage.setEmpId(form.getEmployeeId());
		repMessage.setIsRead("0");
		repMessage.setText( messageBody ); 
		repMessageDao.insert(repMessage);	
	}

	public void getSumApprovedReduceRequest(ShiftReduceRequestForm form) throws ShfException {
		logger.debug("Starting getSumApprovedReduceRequest() ");

		int param=1;
		int sum=0;
		DBAccess db=null;
		try {
			db=new DBAccess();
				try {
					param = 1;
					StringBuffer sql = new StringBuffer();
					sql.append("SELECT COUNT (*) FROM SHIFTER.SHF_SHIFT_REDUCE_CANDIDATE ");
					sql.append("WHERE SHIFT_REDUCE_ID = ? ");
					sql.append("AND APPROVE_TIME IS NOT NULL ");
					
					db.prepareStatement(sql.toString());
					db.setLong(param++,form.getReduceId());
					db.executeQuery();
					
					sum = db.getInt(1);
					form.setSumApproved(sum);
			}catch (DBQueryNoRowsException e) {
				
			}
		} catch (DBException e) {
			logger.error("error in getSumApprovedReduceRequest() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in getSumApprovedReduceRequest() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in declineReduce() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}

	/**
	 * @param reduceRequestForm
	 * @return
	 */
	public Vector getAllNotApprovedCandidate(ShiftReduceRequestForm form) throws ShfException {
		logger.debug("Starting getAllNotApprovedCandidate() ");
		
		int param=1;
		int sum=0;
		DBAccess db=null;
		Vector candidateListVec=new Vector();
		
		try {
			db=new DBAccess();
				try {
					param = 1;
					StringBuffer sql = new StringBuffer();
					
					sql.append(" SELECT E.*, Q.*, D.* ");
					sql.append(" FROM SHIFTER.SHF_SHIFT_REDUCE_CANDIDATE Q ");
					sql.append(" LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY D ON Q.SHF_EMPLOYEE_DAY_ID = D.SHF_EMPLOYEE_DAY_ID "); 
					sql.append(" LEFT JOIN SHIFTER.SHF_EMPLOYEES E ON D.EMP_ID_NUMBER = SUBSTR(E.EMP_ID_NUMBER, 1,8) ");
					sql.append(" WHERE Q.SHIFT_REDUCE_ID = ?  ");
					sql.append(" AND Q.APPROVE_TIME IS NULL ");

					db.prepareStatement(sql.toString()); 
					db.setLong(param++,form.getReduceId());
					db.executeQuery();
					
					db.populate("bzq.shf.forms.ShiftReduceListForm", candidateListVec);
					
			}catch (DBQueryNoRowsException e) {
						
			}
		} catch (DBException e) {
			logger.error("error in getAllNotApprovedCandidate() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in getAllNotApprovedCandidate() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in declineReduce() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		return candidateListVec;
	}

	/**
	 * @param reduceRequestForm
	 */
	public void addReduceReq(ShiftReduceRequestForm form) throws ShfException{
		logger.debug("Starting addReduceReq() " );


		Date startDate=null;
		Date endDate=null;
		String dateStr=BaseConvert.dateToString(form.getDate(), "dd/MM/yyyy");
		try {
			startDate = BaseConvert.stringToDate(dateStr + " " + BaseConvert.dateToString(form.getShiftStart(), "HH:mm"), "dd/MM/yyyy HH:mm");
			endDate = BaseConvert.stringToDate(dateStr + " " + BaseConvert.dateToString(form.getShiftEnd(), "HH:mm"), "dd/MM/yyyy HH:mm");
		}catch (ConvertException e) {
			e.printStackTrace();
		}

		ShiftReduceListForm listForm = new ShiftReduceListForm();
		
		//TODO - check from befor end
		
		listForm.setDate(startDate);
		
		listForm.setAllowedMoked(form.getAllowedMoked());
		checkTimeForReduceShift(listForm);

		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
				try {
					param = 1;
					StringBuffer sql = new StringBuffer();
					sql.append(" INSERT INTO SHIFTER.SHF_SHIFT_REDUCE_REQ ");
					sql.append(" (SHIFT_REDUCE_ID, SHIFT_END, SHIFT_START, ACTIVITY_TYPE_ID, CREATION_TIME, EXCEPTION_SELECTION, "); 
					sql.append(" MODIFICATION_TIME, MODIFICATION_USER,MOKED_ID, NUMBER_OF_AGENTS, AUTOMATIC_APPROVE) ");
					sql.append(" VALUES (SHIFTER.SHF_SRR_ID_SEC.NEXTVAL, ?, ?, ?, ?, ?, ");
					sql.append(" ?, ?, ?, ?, ?) ");


		
					db.prepareStatement(sql.toString());
					db.setTimestamp(param++,endDate);
					db.setTimestamp(param++, startDate);
					db.setString(param++, form.getActivity());
					db.setTimestamp(param++, new Date());
					db.setString(param++, form.getSelectedExceptions());
					db.setTimestamp(param++, new Date());
					db.setString(param++, form.getUserId());
					db.setString(param++, form.getMokedId());
					db.setLong(param++, form.getNumberOfAgets());
					db.setString(param++, form.getAutomaticApprove());
					
					db.executeUpdate();
		
			}catch (DBUpdateNoRowsException e) {
						
			}
				 
		} catch (DBException e) {
			logger.error("error in addReduceReq() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in addReduceReq() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in addReduceReq() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}

	/**
	 * @param l
	 */
	public ShiftReduceRequestForm getReduceForUpdateOrView(long reduceId) throws ShfException {
		
		logger.debug("Starting getReduceForUpdateOrView() ");
		ShiftReduceRequestForm reduceForm = new ShiftReduceRequestForm();
		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
				try {
					param = 1;
					StringBuffer sql = new StringBuffer();
					sql.append("SELECT * FROM SHIFTER.SHF_SHIFT_REDUCE_REQ ");
					sql.append("WHERE SHIFT_REDUCE_ID = ? ");
							
					db.prepareStatement(sql.toString());
					db.setLong(param++, reduceId);
					db.executeQuery();
							
					db.populate(reduceForm);

			}catch (DBQueryNoRowsException e) {
						
			}
		} catch (DBException e) {
			logger.error("error in getReduceForUpdateOrView() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in getReduceForUpdateOrView() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in getReduceForUpdateOrView() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
				
		return reduceForm;
	}

	/**
	 * @param reduceRequestForm
	 */
	public void deleteReduceReq(ShiftReduceRequestForm form) throws ShfException {
		logger.debug("Starting deleteReduceReq() reduceId = " + form.getReduceId());

		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
				try {
					param = 1;
					StringBuffer sql = new StringBuffer();
					sql.append("DELETE SHIFTER.SHF_SHIFT_REDUCE_REQ ");
					sql.append("WHERE SHIFT_REDUCE_ID = ? ");
							
					db.prepareStatement(sql.toString());
					db.setLong(param++,form.getReduceId());
					db.executeUpdate();
		
			}catch (DBUpdateNoRowsException e) {
						
			}
		} catch (DBException e) {
			logger.error("error in deleteReduceReq() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in deleteReduceReq() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in deleteReduceReq() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}


	public void updateReduceReq(ShiftReduceRequestForm form) throws ShfException{
		logger.debug("Starting updateReduceReq() " );

		Date startDate=null;
		Date endDate=null;
		String dateStr=BaseConvert.dateToString(form.getDate(),"dd/MM/yyyy");
		try {
			startDate = BaseConvert.stringToDate(dateStr + " " + BaseConvert.dateToString(form.getShiftStart(), "HH:mm"), "dd/MM/yyyy HH:mm");
			endDate = BaseConvert.stringToDate(dateStr + " " + BaseConvert.dateToString(form.getShiftEnd(), "HH:mm"), "dd/MM/yyyy HH:mm");
		}catch (ConvertException e) {
			e.printStackTrace();
		}

		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
				try {
					param = 1;
					StringBuffer sql = new StringBuffer();

					sql.append(" UPDATE  SHIFTER.SHF_SHIFT_REDUCE_REQ  SET ");
					sql.append("    	 SHIFT_END=?, " ); 					sql.append("		 SHIFT_START=?, " );					sql.append(" 		 ACTIVITY_TYPE_ID=?, "); 					sql.append("		 EXCEPTION_SELECTION=?, ");
					sql.append(" 		 MODIFICATION_TIME=?, ");					sql.append("		 MODIFICATION_USER = ?,");					sql.append("		 MOKED_ID = ?, ");					sql.append("		 NUMBER_OF_AGENTS =?, ");					sql.append("		 AUTOMATIC_APPROVE=? ");
					sql.append(" WHERE 	 SHIFT_REDUCE_ID = ? ");

		
					db.prepareStatement(sql.toString());
					db.setTimestamp(param++,endDate);
					db.setTimestamp(param++, startDate);
					db.setString(param++, form.getActivity());
					db.setString(param++, form.getSelectedExceptions());
					db.setTimestamp(param++, new Date());
					db.setString(param++, form.getUserId());
					db.setString(param++, form.getMokedId());
					db.setLong(param++, form.getNumberOfAgets());
					db.setString(param++, form.getAutomaticApprove());
					db.setLong(param++, form.getReduceId());
					
					db.executeUpdate();
		
			}catch (DBUpdateNoRowsException e) {
						
			}
				 
		} catch (DBException e) {
			logger.error("error in updateReduceReq() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in updateReduceReq() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in updateReduceReq() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public void updateReduceReqNumOfAgent(ShiftReduceRequestForm form) throws ShfException{
		logger.debug("Starting updateReduceReqNumOfAgent() " );

		int param=1;
		DBAccess db=null;
		try {
			db=new DBAccess();
				try {
					param = 1;
					StringBuffer sql = new StringBuffer();

					sql.append(" UPDATE  SHIFTER.SHF_SHIFT_REDUCE_REQ  SET ");
					sql.append("		 NUMBER_OF_AGENTS =? ");
					sql.append(" WHERE 	 SHIFT_REDUCE_ID = ? ");
	
					db.prepareStatement(sql.toString());
					db.setLong(param++, form.getNumberOfAgets());
					db.setLong(param++, form.getReduceId());
					
					db.executeUpdate();
		
				}catch (DBUpdateNoRowsException e) {
			}
		} catch (DBException e) {
			logger.error("error in updateReduceReqNumOfAgent() : "+ e.getMessage());
			logger.debug("starting rollback ");
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error while db.rollback() in updateReduceReqNumOfAgent() : "+ e1.getMessage());
			}
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in updateReduceReqNumOfAgent() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public void declineAllNotApproved(ShiftReduceRequestForm form) throws ShfException {
		Vector reduceCandidateVec = null;
		reduceCandidateVec = getAllNotApprovedCandidate(form);
		if ((reduceCandidateVec != null ) && reduceCandidateVec.size() > 0 ) {
			for (int i=0; i<reduceCandidateVec.size();i++) {
				declineReduce((ShiftReduceListForm)reduceCandidateVec.get(i) );
				writeMassageForReduce((ShiftReduceListForm)reduceCandidateVec.get(i), SHFConstants.DECLINE_REDUCE);
			}
		}
	}


}
