/*
 * Created on 12/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;

import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Vector;

import javax.jms.JMSException;
import javax.naming.NamingException;
import javax.servlet.ServletContext;
import javax.xml.bind.JAXBException;
import javax.xml.xpath.XPathExpressionException;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.w3c.dom.Document;

import com.ibm.websphere.ce.cm.DuplicateKeyException;

import bzq.shfsp.request.SHFSPBreaks;
import bzq.shfsp.request.SHFSPBreaks.*;
import bzq.shfsp.response.*;

import bzq.db.DBAccess;
import bzq.db.DBDuplicateKeyException;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.BreakBean;
import bzq.shf.bean.BreakCandidateBean;
import bzq.shf.bean.EmployeeEventBean;
import bzq.shf.bean.TransactionBean;
import bzq.shf.dao.ReplaceMassageDao;
import bzq.shf.forms.AttendanceSearchForm;
import bzq.shf.forms.BreakSearchForm;
import bzq.shf.forms.EventReasonForm;
import bzq.shf.forms.ShiftBreakForm;
import bzq.shf.forms.ShiftDataForm;
import bzq.shf.transfer.ReplaceMassage;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TibcoQueueMessageSender;
import bzq.shfsp.request.SHFSPBreaks.BreakInfo;
import bzq.utils.AppResources;
import bzq.utils.BaseConvert;
import bzq.utils.ConvertException;
import bzq.utils.TablesContainer;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class BreakDataModel {
	private static Logger logger = Logger.getLogger(BreakDataModel.class);
	private ServletContext sCtx;
	
	public BreakDataModel(){
		
	}
	
	public void setCurrentDefaults(BreakSearchForm form) {
		logger.debug("Starting setCurrentDefaults()");
		
		if(form.getAllowedMoked()!=null){
			form.setMoked(form.getAllowedMoked());
		}
		
		Calendar cal=Calendar.getInstance();
//		cal.getTime();
		cal.add(Calendar.HOUR_OF_DAY, -1);
		String hour = String.valueOf(cal.get(Calendar.HOUR_OF_DAY));
		hour=(cal.get(Calendar.HOUR_OF_DAY)<10)?"0"+hour:hour;
		((BreakSearchForm)form).setTime(hour + ":00");
		((BreakSearchForm)form).setDate(cal.getTime());
		
		String to_hour=null;
		cal.setTime(new Date());
		cal.getTime();
		cal.add(Calendar.HOUR_OF_DAY, 1);
		to_hour = String.valueOf(cal.get(Calendar.HOUR_OF_DAY));
		to_hour=(cal.get(Calendar.HOUR_OF_DAY)<10)?"0"+to_hour:to_hour;
		((BreakSearchForm)form).setTo_time(to_hour + ":00");
		
		((BreakSearchForm)form).setRefhreshed_time(getCurentTime());
	}
	public String getCurentTime() {
		Calendar cal=Calendar.getInstance();
		String refreshed_hour=null;
		String refreshed_minute=null;
		cal.getTime();
		refreshed_hour = String.valueOf(cal.get(Calendar.HOUR_OF_DAY));
		refreshed_hour=(cal.get(Calendar.HOUR_OF_DAY)<10)?"0"+refreshed_hour:refreshed_hour;
		refreshed_minute = String.valueOf(cal.get(Calendar.MINUTE));
		refreshed_minute=(cal.get(Calendar.MINUTE)<10)?"0"+refreshed_minute:refreshed_minute;
		return(refreshed_hour +":"+ refreshed_minute);
		
	}

	public void populateAllBreaksInRange(BreakSearchForm form) throws ShfException{
		logger.debug("Starting populateAllBreaksInRange()");
		
//		new Vector();
		int param_index=1;
		
		Date fromDateTime = null;
		Date toDateTime = null;
		String tempDateS = null;

		try {
			tempDateS = BaseConvert.dateToString(form.getDate(),"dd/MM/yyyy")+" " +form.getTime();
			fromDateTime = BaseConvert.stringToDate(tempDateS, "dd/MM/yyyy HH:mm");

			tempDateS = BaseConvert.dateToString(form.getDate(),"dd/MM/yyyy")+" " +form.getTo_time();
			toDateTime = BaseConvert.stringToDate(tempDateS, "dd/MM/yyyy HH:mm");

			tempDateS = BaseConvert.dateToString(form.getDate(),"dd/MM/yyyy")+" " +form.getRefhreshed_time();
			BaseConvert.stringToDate(tempDateS, "dd/MM/yyyy HH:mm");

		} catch (ConvertException e) {
			e.printStackTrace();
		}
		
		StringBuffer sSql=new StringBuffer();
	
		sSql.append("SELECT ");
		sSql.append("A.AGENT_DAY_ID, ");
		sSql.append("A.DURATION, ");
		sSql.append("A.EXIT_TIME, ");
		sSql.append("A.ENTRY_TIME, ");
		sSql.append("B.FIRST_NAME, ");
		sSql.append("B.LAST_NAME,  ");
		sSql.append("A.START_TIME, ");
		sSql.append("A.END_TIME, ");
		sSql.append("B.EMPLOYEE_ID, ");
		sSql.append("B.ORG_UNIT_ID, ");
		sSql.append("B.INNER_JOB_ID, ");
		sSql.append("E.NEW_ACTIVITY, ");
		sSql.append("C.WM_SCH_ACTIVITY_ID_DATA, ");
		sSql.append("C.WORK_FROM_HOME, ");
		sSql.append("E.NEW_WORK_FROM_HOME ");
		sSql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_ATTENDANCE T ON T.SHF_EMPLOYEE_DAY_ID=C.SHF_EMPLOYEE_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.SHF_EMPLOYEE_DAY_ID=A.AGENT_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = NVL(E.NEW_EMPLOYEE_ID,C.EMP_ID_NUMBER) "); 
		sSql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID ");
		sSql.append("WHERE B.EMPLOYEE_ID IS NOT NULL AND A.CANCEL_REASON_CODE is null AND T.MISS_REASON_ID IS NULL ");
		sSql.append(" AND T.MISS_REASON_ID IS NULL "); //added by Yuval 29.10.09 for not showing break for missing shifts		
		sSql.append("AND A.STATE_TYPE  = ? ");							// 1
		sSql.append("AND   A.START_TIME BETWEEN ( ? ) AND ( ? ) ");		// 2, 3

		if ( !"".equals(((BreakSearchForm)form).getFirstName()) && !(((BreakSearchForm)form).getFirstName() == null) )  
		{
			sSql.append("AND B.FIRST_NAME LIKE ? ");					// 4
		}
		if ( !"".equals(((BreakSearchForm)form).getLastName()) && !(((BreakSearchForm)form).getLastName() == null) )  
		{
			sSql.append("AND B.LAST_NAME LIKE ? ");						// 5
		}
		
		// Svetlana
		/*if( ((BreakSearchForm)form).getActivity()!=null && (!"00".equals(((BreakSearchForm)form).getActivity()[0]))){
			sSql.append("AND replace(C.WM_SCH_ACTIVITY_ID_DATA,';','') in ( ");
			String[] array = ((BreakSearchForm)form).getActivity();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}*/
		if( ((BreakSearchForm)form).getInnerJob()!=null && (!"00".equals(((BreakSearchForm)form).getInnerJob()[0]))){
			sSql.append("AND B.INNER_JOB_ID in (");
			String[] array = ((BreakSearchForm)form).getInnerJob();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}
		
		
		if(((BreakSearchForm)form).getMoked()!=null && !((BreakSearchForm)form).getMoked().equals("-1")){
			if(((BreakSearchForm)form).getTeamCode()!=null && !((BreakSearchForm)form).getTeamCode()[0].equals("00")){
				sSql.append("AND b.ORG_UNIT_ID in ( ");
				String[] array = ((BreakSearchForm)form).getTeamCode();
				for(int i=0;i<array.length;i++){
					sSql.append(array[i]);
					if(i<array.length-1) sSql.append(",");
				}
				sSql.append(") ");
			}
			else{
				sSql.append("AND d.PARENT_UNIT = ? ");					// 6
			}
		}
		else{
			  StringBuffer unitSelect = new StringBuffer("");
			  unitSelect.append("AND d.PARENT_UNIT IN (" );
			  Vector allowedUnits = ((BreakSearchForm)form).getAllowedUnits();
			  Iterator  it = allowedUnits.iterator();
			  while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
					unitSelect.append(","); 
			  } 
			  unitSelect.append(" ) ");
	
			  sSql.append(unitSelect);		
			}
		
		if (form.getShiftLocation() != null && ! "00".equals(form.getShiftLocation()[0])) {
			
			sSql.append("AND NVL(E.NEW_WORK_FROM_HOME, C.WORK_FROM_HOME) IN (");
			List<String> list = Arrays.asList(form.getShiftLocation());
			
			if (list.contains(SHFConstants.SHIFT_LOCATION_HOME)) {
				sSql.append("'Y'");
			}
			if (list.size() > 1) {
				sSql.append(",");
			}			
			if (list.contains("site")) {
				sSql.append("'N'");
			}
			sSql.append(") ");	
		}
		
		sSql.append(" ORDER BY A.START_TIME,B.FIRST_NAME,B.LAST_NAME ");
		//populate param & execute	
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			db.setInt(param_index++, SHFConstants.STATE_BREAK);
			db.setTimestamp(param_index++, fromDateTime);
			db.setTimestamp(param_index++, toDateTime);
			if ( !"".equals(((BreakSearchForm)form).getFirstName()) && !(((BreakSearchForm)form).getFirstName() == null) )  
			{
				db.setString(param_index++, ((BreakSearchForm)form).getFirstName().replace('*','%'));
			}			
			if ( !"".equals(((BreakSearchForm)form).getLastName()) && !(((BreakSearchForm)form).getLastName() == null) )  
			{
				db.setString(param_index++, ((BreakSearchForm)form).getLastName().replace('*','%'));
			}
			
			
			if(((BreakSearchForm)form).getMoked()!=null && !((BreakSearchForm)form).getMoked().equals("-1")){
				
				if(((BreakSearchForm)form).getTeamCode()!=null && !((BreakSearchForm)form).getTeamCode()[0].equals("00")){
					//db.setString(param_index++,((BreakSearchForm)form).getTeamCode());
				} else {
					db.setString(param_index++,((BreakSearchForm)form).getMoked());
				}
			}
			
//			if (form.getShiftLocation() != null && ! "00".equals(form.getShiftLocation())) {
//				db.setString(param_index++, SHFConstants.SHIFT_LOCATION_HOME.equals(form.getShiftLocation()) ? "Y" : "N");
//			}

			BreakBean breakBean = new BreakBean();
			Vector<BreakBean> vBreak = new Vector<BreakBean>();
			db.executeQuery();
			while(db.next()){
				breakBean = new BreakBean();
				db.populate(breakBean);
				
				if(breakBean!=null ){
					vBreak.add(breakBean);
					} 
			}
			form.setBreakVecCurrent(vBreak);


	} catch(DBQueryNoRowsException e){
	
	} catch (DBException e) {
		logger.error("DB error :", e);
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);
	} finally{
		try {
			db.close();
		} catch (DBException e) {
			throw new ShfException("dBAccess.close()", e);
		}
	}			

	}	
	
	/*public void populateCurrentBreaks(BreakSearchForm form) throws ShfException{
		logger.debug("Starting populateCurrentBreaks()");
		
		Vector vec=new Vector();
		int param_index=1;
		
		Date currentDate = null;
		Date afterDate = null;
		Date beforDate = null;
		String currentDateS = null;
		
		currentDateS = BaseConvert.dateToString(form.getDate(),"dd/MM/yyyy")+" " +form.getTime();
		try {
			currentDate = BaseConvert.stringToDate(currentDateS, "dd/MM/yyyy HH:mm");
		} catch (ConvertException e) {
			e.printStackTrace();
		}
		
		//the hour befor or after can be a var
		afterDate = SHFUtils.getTimeCalc(currentDate,240);
		beforDate = SHFUtils.getTimeCalc(currentDate , -240);
		
		StringBuffer sSql=new StringBuffer();
	
		sSql.append("SELECT ");
		sSql.append("A.EXIT_TIME, ");
		sSql.append("A.ENTRY_TIME, ");
		sSql.append("B.FIRST_NAME, ");
		sSql.append("B.LAST_NAME,  ");
		sSql.append("A.START_TIME, ");
		sSql.append("A.END_TIME, ");
		sSql.append("B.EMPLOYEE_ID, ");
		sSql.append("B.ORG_UNIT_ID, ");
		sSql.append("E.NEW_ACTIVITY, ");
		sSql.append("C.WM_SCH_ACTIVITY_ID_DATA ");	
		sSql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_ATTENDANCE T ON T.SHF_EMPLOYEE_DAY_ID=C.SHF_EMPLOYEE_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.SHF_EMPLOYEE_DAY_ID=A.AGENT_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = NVL(E.NEW_EMPLOYEE_ID,C.EMP_ID_NUMBER) "); 
		sSql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID ");
		//sSql.append("LEFT JOIN SHIFTER.shf_attendance f on f.shf_employee_day_id=C.shf_employee_day_id ");		
		sSql.append("WHERE B.EMPLOYEE_ID IS NOT NULL AND T.MISS_REASON_ID IS NULL ");
		//sSql.append(" and f.miss_reason_id is null "); //added by Yuval 29.10.09 for not showing break for missing shifts		
		sSql.append("AND A.STATE_TYPE  = ? ");
		sSql.append("AND   ? BETWEEN (A.START_TIME -1/24) AND (A.END_TIME + 1/24) ");

		if ( !"".equals(((BreakSearchForm)form).getFirstName()) && !(((BreakSearchForm)form).getFirstName() == null) )  
		{
			sSql.append("AND B.FIRST_NAME LIKE ? ");
		}
		if ( !"".equals(((BreakSearchForm)form).getLastName()) && !(((BreakSearchForm)form).getLastName() == null) )  
		{
			sSql.append("AND B.LAST_NAME LIKE ? ");
		}
		if( ((BreakSearchForm)form).getActivity()!=null && (!"00".equals(((BreakSearchForm)form).getActivity()[0]))){
			sSql.append("AND replace(C.WM_SCH_ACTIVITY_ID_DATA,';','') in ( ");
			String[] array = ((BreakSearchForm)form).getActivity();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}
		if(((BreakSearchForm)form).getMoked()!=null && !((BreakSearchForm)form).getMoked().equals("-1")){
			if(((BreakSearchForm)form).getTeamCode()!=null && !((BreakSearchForm)form).getTeamCode()[0].equals("00")){
				sSql.append("AND b.ORG_UNIT_ID in ( ");
				String[] array = ((BreakSearchForm)form).getTeamCode();
				for(int i=0;i<array.length;i++){
					sSql.append(array[i]);
					if(i<array.length-1) sSql.append(",");
				}
				sSql.append(") ");
			}
			else{
				sSql.append("AND d.PARENT_UNIT = ? ");
			}
		}
		else{
			  StringBuffer unitSelect = new StringBuffer("");
			  unitSelect.append("AND d.PARENT_UNIT IN (" );
			  Vector allowedUnits = ((BreakSearchForm)form).getAllowedUnits();
			  Iterator  it = allowedUnits.iterator();
			  while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
					unitSelect.append(","); 
			  } 
			  unitSelect.append(" )");
	
			  sSql.append(unitSelect);		
			}
			
		sSql.append(" order by A.START_TIME,B.FIRST_NAME,B.LAST_NAME ");
		//populate param & execute	
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			db.setInt(param_index++, SHFConstants.STATE_BREAK);
			db.setTimestamp(param_index++, currentDate);
			if ( !"".equals(((BreakSearchForm)form).getFirstName()) && !(((BreakSearchForm)form).getFirstName() == null) )  
			{
				db.setString(param_index++, ((BreakSearchForm)form).getFirstName().replace('*','%'));
			}			
			if ( !"".equals(((BreakSearchForm)form).getLastName()) && !(((BreakSearchForm)form).getLastName() == null) )  
			{
				db.setString(param_index++, ((BreakSearchForm)form).getLastName().replace('*','%'));
			}
			
			
			
			if(((BreakSearchForm)form).getMoked()!=null && !((BreakSearchForm)form).getMoked().equals("-1")){
				if(((BreakSearchForm)form).getTeamCode()!=null && !((BreakSearchForm)form).getTeamCode()[0].equals("00")){
					//db.setString(param_index++,((BreakSearchForm)form).getTeamCode());
				}
				else{
					db.setString(param_index++,((BreakSearchForm)form).getMoked());
					}
			}	

			BreakBean breakBean = new BreakBean();
			Vector vBreak = new Vector();
			db.executeQuery();
			while(db.next()){
				breakBean = new BreakBean();
				db.populate(breakBean);
				
				if(breakBean!=null ){
					vBreak.add(breakBean);
					} 
			}
			form.setBreakVecCurrent(vBreak);


	} catch(DBQueryNoRowsException e){
	
	} catch (DBException e) {
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);
	} finally{
		try {
			db.close();
		} catch (DBException e) {
			throw new ShfException("dBAccess.close()", e);
		}
	}			

	}*/
/*
	public void populateExceptionBreaks(BreakSearchForm form) throws ShfException{
		logger.debug("Starting populateExceptionBreaks()");
		
		Vector vec=new Vector();
		int param_index=1;

		Date currentDate = null;
		Date afterDate = null;
		Date beforDate = null;
		String currentDateS = null;
		
		currentDateS = BaseConvert.dateToString(form.getDate(),"dd/MM/yyyy")+" " +form.getTime();
		try {
			currentDate = BaseConvert.stringToDate(currentDateS, "dd/MM/yyyy HH:mm");
		} catch (ConvertException e) {
			e.printStackTrace();
		}
		
		//the hour befor or after can be a var
		afterDate = SHFUtils.getTimeCalc(currentDate,240);
		beforDate = SHFUtils.getTimeCalc(currentDate , -240);
		
		StringBuffer sSql=new StringBuffer();
	
		sSql.append("SELECT ");
		sSql.append("A.EXIT_TIME, ");
		sSql.append("A.ENTRY_TIME, ");
		sSql.append("B.FIRST_NAME, ");
		sSql.append("B.LAST_NAME,  ");
		sSql.append("A.START_TIME, ");
		sSql.append("A.END_TIME, ");
		sSql.append("B.EMPLOYEE_ID, ");
		sSql.append("B.ORG_UNIT_ID, ");
		sSql.append("E.NEW_ACTIVITY, ");
		sSql.append("C.WM_SCH_ACTIVITY_ID_DATA ");	
		sSql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.SHF_EMPLOYEE_DAY_ID=A.AGENT_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = NVL(E.NEW_EMPLOYEE_ID,C.EMP_ID_NUMBER) "); 
		sSql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID ");
		sSql.append("WHERE B.EMPLOYEE_ID IS NOT NULL ");
		sSql.append("AND to_date(A.start_time)=? ");
		sSql.append("AND A.STATE_TYPE  = ? ");
		sSql.append("AND  TO_DATE( ? ,'DD/MM/YYYY HH24:MI') NOT BETWEEN A.START_TIME AND A.END_TIME  ");
		sSql.append("AND  (  ( TO_DATE( ? ,'DD/MM/YYYY HH24:MI') BETWEEN A.EXIT_TIME AND A.ENTRY_TIME ) ");
		sSql.append("OR ( A.EXIT_TIME <= TO_DATE( ? ,'DD/MM/YYYY HH24:MI') AND A.ENTRY_TIME IS NULL )  ) ");
		
		if ( !"".equals(((BreakSearchForm)form).getFirstName()) && !(((BreakSearchForm)form).getFirstName() == null) ) 
		{
			sSql.append("AND B.FIRST_NAME LIKE ? ");
		}
		if ( !"".equals(((BreakSearchForm)form).getLastName()) && !(((BreakSearchForm)form).getLastName() == null) )  
		{
			sSql.append("AND B.LAST_NAME LIKE ? ");
		}
		
		if( ((BreakSearchForm)form).getActivity()!=null && (!"00".equals(((BreakSearchForm)form).getActivity()[0]))){
			sSql.append("AND replace(C.WM_SCH_ACTIVITY_ID_DATA,';','') in ( ");
			String[] array = ((BreakSearchForm)form).getActivity();
			for(int i=0;i<array.length;i++){
				sSql.append(array[i]);
				if(i<array.length-1) sSql.append(",");
			}
			sSql.append(")");
		}
		
		
		if(((BreakSearchForm)form).getMoked()!=null && !((BreakSearchForm)form).getMoked().equals("-1")){
			if(((BreakSearchForm)form).getTeamCode()!=null && !((BreakSearchForm)form).getTeamCode()[0].equals("00")){
				sSql.append("AND b.ORG_UNIT_ID in ( ");
				String[] array = ((BreakSearchForm)form).getTeamCode();
				for(int i=0;i<array.length;i++){
					sSql.append(array[i]);
					if(i<array.length-1) sSql.append(",");
				}
				sSql.append(") ");
			}
			else{
				sSql.append("AND d.PARENT_UNIT = ? ");
			}
		}
		else{
			  StringBuffer unitSelect = new StringBuffer("");
			  unitSelect.append("AND d.PARENT_UNIT IN (" );
			  Vector allowedUnits = ((BreakSearchForm)form).getAllowedUnits();
			  Iterator  it = allowedUnits.iterator();
			  while (it.hasNext()) {
				unitSelect.append( it.next()); 
				if (it.hasNext()) 
					unitSelect.append(","); 
			  } 
			  unitSelect.append(" )");
	
			  sSql.append(unitSelect);		
			}
			
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			db.setDate(param_index++, currentDate);
			db.setInt(param_index++, SHFConstants.STATE_BREAK);
			db.setString(param_index++, currentDateS);
			db.setString(param_index++, currentDateS);
			db.setString(param_index++, currentDateS);
			if ( !"".equals(((BreakSearchForm)form).getFirstName()) && !(((BreakSearchForm)form).getFirstName() == null) )  
			{
				db.setString(param_index++, ((BreakSearchForm)form).getFirstName().replace('*','%'));
			}			
			if ( !"".equals(((BreakSearchForm)form).getLastName()) && !(((BreakSearchForm)form).getLastName() == null) )  
			{
				db.setString(param_index++, ((BreakSearchForm)form).getLastName().replace('*','%'));
			}
				
			
			if(((BreakSearchForm)form).getMoked()!=null && !((BreakSearchForm)form).getMoked().equals("-1")){
				if(((BreakSearchForm)form).getTeamCode()!=null && !((BreakSearchForm)form).getTeamCode()[0].equals("00")){
					//db.setString(param_index++,((BreakSearchForm)form).getTeamCode());
				}
				else{
					db.setString(param_index++,((BreakSearchForm)form).getMoked());
				}
			}	

			BreakBean breakBean = new BreakBean();
			Vector vBreak = new Vector();
			db.executeQuery();
			while(db.next()){
				breakBean = new BreakBean();
				db.populate(breakBean);
				
				if(breakBean!=null ){
					vBreak.add(breakBean);
				} 
			}
			form.setBreakVecExceptional(vBreak);


	} catch(DBQueryNoRowsException e){
	
	} catch (DBException e) {
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
//		logger.error("Attendance.get att list(): no rows returned " + e);
		throw new ShfException(actionErrors);
	} finally{
		try {
			db.close();
		} catch (DBException e) {
			throw new ShfException("dBAccess.close()", e);
		}
	}			

	}*/

	public static Vector<BreakBean> populateBreaksForShift(long agentDayId) throws ShfException{
		logger.debug("Starting populateBreaksForShift() dayId = "+ agentDayId);
		
		int param_index = 1;
		Vector<BreakBean> resVec = new Vector<BreakBean>();
	
		StringBuffer sSql = new StringBuffer();
		
		sSql.append("SELECT ");
		sSql.append("A.AGENT_DAY_ID, ");
		sSql.append("A.START_TIME, ");
		sSql.append("A.END_TIME, ");
		sSql.append("A.DURATION, ");
		sSql.append("A.EXIT_TIME, ");
		sSql.append("A.ENTRY_TIME, ");
		sSql.append("A.MODIFICATION_TIME, ");
		sSql.append("A.MODIFICATION_USER, ");
		sSql.append("B.FIRST_NAME, ");
		sSql.append("B.LAST_NAME, ");
		sSql.append("B.EMPLOYEE_ID, ");
		sSql.append("B.ORG_UNIT_ID, ");
		sSql.append("E.NEW_ACTIVITY, ");
		sSql.append("C.WM_SCH_ACTIVITY_ID_DATA ");
		sSql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.SHF_EMPLOYEE_DAY_ID=A.AGENT_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = NVL(E.NEW_EMPLOYEE_ID,C.EMP_ID_NUMBER) ");
		sSql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID ");
		sSql.append("WHERE B.EMPLOYEE_ID IS NOT NULL AND A.CANCEL_REASON_CODE is null ");
		sSql.append("AND A.STATE_TYPE  = ? ");
		sSql.append("AND A.AGENT_DAY_ID = ? ");
		sSql.append("ORDER BY A.START_TIME");
		
		DBAccess db=null;
		try {
			db = new DBAccess();
			db.prepareStatement(sSql.toString());
			db.setInt(param_index++, SHFConstants.STATE_BREAK);	
			db.setLong(param_index++,agentDayId);
			db.executeQuery();
			db.populate("bzq.shf.bean.BreakBean",resVec);
			
	} catch(DBQueryNoRowsException e){
	
	} catch (DBException e) {
		logger.error("error in populateBreaksForShift: "+e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
		throw new ShfException(actionErrors);
	} finally{
		try {
			db.close();
		} catch (DBException e) {
			logger.error("error in populateBreaksForShift while closing db: "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
			throw new ShfException(actionErrors);
		}
	}			
	return resVec;	
	}
	
	/**
	 * @param breakInfo
	 */
	public void exitToBreak(BreakBean breakInfo)throws ShfException {
		logger.debug("Starting exitToBreak() dayId = " + breakInfo.getAgentDayId());
		
		String sql="update SHIFTER.shf_employee_exceptions t " +			"set t.exit_time = ? where t.agent_day_id=? " +			"and t.state_type = ? and t.start_time = ? ";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setTimestamp(1,breakInfo.getExitTime());
			db.setLong(2,breakInfo.getAgentDayId());
			db.setInt(3,SHFConstants.STATE_BREAK);
			db.setTimestamp(4,breakInfo.getStartTime());
			db.executeUpdate();
		} catch(DBUpdateNoRowsException e){
			logger.error("No rows to update : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailed",null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("DB Error while update : "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("DB Error while closing connection : "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
				throw new ShfException(actionErrors);
			}
		}	
		
	}
	
	public static void populateBreak(BreakBean breakInfo) throws ShfException{
		logger.debug("Starting populateBreak() ");
		
		StringBuffer sSql=new StringBuffer();
		sSql.append("SELECT ");
		sSql.append("x.*, ");
		sSql.append("e.FIRST_NAME, ");
		sSql.append("e.LAST_NAME,  ");
		sSql.append("e.EMPLOYEE_ID, ");
		sSql.append("e.ORG_UNIT_ID, ");
		sSql.append("c.NEW_ACTIVITY, ");
		sSql.append("d.WM_SCH_ACTIVITY_ID_DATA ");	
		sSql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS x ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY d ON d.SHF_EMPLOYEE_DAY_ID = x.AGENT_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES c ON c.SHF_EMPLOYEE_DAY_ID=d.SHF_EMPLOYEE_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES e ON SUBSTR(e.EMP_ID_NUMBER,1,8) = NVL(c.NEW_EMPLOYEE_ID,d.EMP_ID_NUMBER) "); 
		sSql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT o ON e.ORG_UNIT_ID = o.ORG_UNIT_ID ");
		sSql.append("WHERE e.EMPLOYEE_ID IS NOT NULL AND x.CANCEL_REASON_CODE is null ");
		sSql.append("AND x.STATE_TYPE = ? AND  x.agent_day_id=? AND x.start_time=? ");

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			db.setInt(1,SHFConstants.STATE_BREAK);
			db.setLong(2,breakInfo.getAgentDayId());
			db.setTimestamp(3,breakInfo.getStartTime());
			db.executeQuery();
			if(db.next())
				db.populate(breakInfo);
		} catch (DBQueryNoRowsException e){
			logger.error("DBQueryNoRowsException in populateBreak(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("DB error in populateBreak(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in populateBreak() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
	}
	
	public void checkLate(BreakBean breakInfo) throws ShfException{
		
		int allowedLate=Integer.parseInt(SHFParameters.getMinimalBreakLate(breakInfo.getAllowedMoked()).getValue());
		int allowedShifting=Integer.parseInt(SHFParameters.getMinimalBreakShifting(breakInfo.getAllowedMoked()).getValue());
		int actualShifting=SHFUtils.getMinutesBetween(breakInfo.getEndTime(),breakInfo.getEntryTime());
		int actual=SHFUtils.getMinutesBetween(breakInfo.getExitTime(),breakInfo.getEntryTime());
		int planned=SHFUtils.getMinutesBetween(breakInfo.getStartTime(),breakInfo.getEndTime());
		
		if(allowedShifting<actualShifting){
			logger.info("back from break after "+actualShifting+" minutes from planned end.");
			//late entry event.
		}
		
		logger.info("shift: "+breakInfo.getAgentDayId()+" break: "+BaseConvert.dateToString(breakInfo.getStartTime(),"HH:mm")+ " break duration was "+actual+" minutes instead of "+planned);
		if(actual > planned+allowedLate){
			logger.info("a break duration event should be added for employee");
			//long break event.
			addEventBreakLate(breakInfo,(actual-(planned+allowedLate)));
		}else{
			logger.info("no event should be written");
		}
	}
	
	private void addEventBreakLate(BreakBean breakInfo,int length) throws ShfException{
		logger.info("Starting addEventBreakLate() dayId = " + breakInfo.getAgentDayId());
		EmployeeEventBean lateEvent=new EmployeeEventBean();
		lateEvent.setEmployee_day_id(breakInfo.getAgentDayId());
		lateEvent.setEmployee_id(Integer.parseInt(breakInfo.getEmployeeId()));
		lateEvent.setCreation_time(breakInfo.getEntryTime());
		lateEvent.setUserFirstName(breakInfo.getUserFirstName());
		lateEvent.setUserLastName(breakInfo.getUserLastName());
		lateEvent.setTime(breakInfo.getEntryTime());
		lateEvent.setDate(breakInfo.getEntryTime());
		lateEvent.setLength(length);
		lateEvent.setRemark("משך הפסקה גדול"); 
		lateEvent.setHour(BaseConvert.dateToString(breakInfo.getEntryTime(),"HH:mm"));
		
		AppResources appRes=AppResources.getInstance();
		TablesContainer tc=appRes.getTablesContainer();
		Vector reasons=tc.getTable("eventReasonCode");
		for(int i=0;i<reasons.size();i++){
			EventReasonForm reason=(EventReasonForm)reasons.get(i);
			if(reason.getType()==SHFConstants.BREAK_LATE){
				lateEvent.setReason(Integer.parseInt(reason.getCode()));
				break;
			}
		}
		
		if(!(lateEvent.getReason()>0)){
			logger.error("error in addEventBreakLate: no Break Late Reason found in DB");
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.brealLateReasonNotExist"));
			throw new ShfException(actionErrors);
		}
		
		EmployeeDataModel employeeDataModel=new EmployeeDataModel(lateEvent);
		employeeDataModel.addEvent();
		
	}
	
	public void backFromBreak(BreakBean breakInfo)throws ShfException {
		logger.debug("Starting backFromBreak()" );

		String sql="update SHIFTER.shf_employee_exceptions t " +
			"set t.entry_time = ? where t.agent_day_id=? " +
			"and t.STATE_TYPE = ? and t.start_time = ? ";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setTimestamp(1,breakInfo.getEntryTime());
			db.setLong(2,breakInfo.getAgentDayId());
			db.setInt(3,SHFConstants.STATE_BREAK);
			db.setTimestamp(4,breakInfo.getStartTime());
			db.executeUpdate();
			
		} catch(DBUpdateNoRowsException e){
			logger.error("No rows found for update while backFromBreak() :" +e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailed",null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			logger.error("DB error while update :" +e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in backFromBreak() while closing db connection: "+e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}	
		
	}
	/**
	 * @param breakInfo
	 * @param newLength
	 */
	public static void moveBreaks(BreakBean breakInfo, int difference, DBAccess db) throws ShfException{
		logger.debug("Starting moveBreaks() dayId = " + breakInfo.getAgentDayId() + " by "+difference+" minutes");
		
		boolean tx = db == null ? false : true;	// for managed breaks
		
		String sql="update SHIFTER.shf_employee_exceptions t "+
					"set t.start_time=t.start_time+(?/1440), "+
					"t.end_time = t.end_time+(?/1440) , t.SOURCE='SHF' "+
					"where t.agent_day_id=? and t.state_type = ?";
					
//		DBAccess db=null;
		try {
			if ( ! tx ) {
				db = new DBAccess();
			}
			
			db.prepareStatement(sql);
			db.setInt(1,difference);
			db.setInt(2,difference);
			db.setLong(3,breakInfo.getAgentDayId());
			db.setInt(4,SHFConstants.STATE_BREAK);
			db.executeUpdate();
			
		}catch(DBUpdateNoRowsException e){ 
		
		}catch (DBException e) {
			logger.error("DB error while update : ", e);
			throw new ShfException("DB error while update", e);
		}finally{
			if ( ! tx ) {
				try {
					db.close();	
				} catch (DBException e) {
					logger.error("error in moveBreaks() while closing db connection: "+e.getMessage());
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
					throw new ShfException(actionErrors);
				}
			}
		}	
	}
	
	/**
	 * @param shiftForm
	 */
	public static void deleteInvalidBreaks(AgentDayBean day, DBAccess db) throws ShfException {
		logger.debug("Starting deleteInvalidBreaks() dayId = " + day.getAgentDayId());
		
		boolean tx = db == null ? false : true;
		
		int param=1;
		String sql="delete from SHIFTER.shf_employee_exceptions where " +
			"agent_day_id=? and ( start_time < ? + ?/24  or end_time > ? - ?/24 ) and state_type = ?";
		
//		DBAccess db=null;
		try {
			if ( ! tx ) {
				db = new DBAccess();
			}
			db.prepareStatement(sql);
			db.setLong(param++, day.getAgentDayId());
			db.setTimestamp(param++, day.getShiftStart());
			db.setInt(param++, 1);
			db.setTimestamp(param++, day.getShiftEnd());
			db.setInt(param++, 1);
			db.setInt(param++, SHFConstants.STATE_BREAK);
			db.executeUpdate();
	
		}catch(DBUpdateNoRowsException e){ 

		}catch (DBException e) {
			logger.error("error in deleteInvalidBreaks(): "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}finally{
			if ( ! tx ) {
				try {
					db.close();	// Disabled for managed breaks
				} catch (DBException e) {
					logger.error("error in deleteInvalidBreaks() while closing db connection: "+e.getMessage());
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
					throw new ShfException(actionErrors);
				}
			}
		}	
	}
	


	public void checkValidBreakCandidate(BreakBean form) throws ShfException {
		logger.debug("Starting checkValidBreakCandidate()");
		
		Calendar cal=Calendar.getInstance();
		BaseConvert.dateToString(cal.getTime(), "dd/MM/yyyy HH:mm");
		BaseConvert.dateToString(form.getStartTime(),"dd/MM/yyyy HH:mm");
		
		if ( form.getStartTime().before(cal.getTime()) ){ 	//check that the time of the break is befor now
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.breakTimeProblem", null));					
			throw new ShfException(actionErrors);
		}
		
		populateBreak(form);
		if(form.getExitTime()!=null){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.switchBreakEntryExit", null));					
			throw new ShfException(actionErrors);
		}
		
		checkIfBreakTooClose(form);
		checkIfBreakExist(form) ; 
		ShiftDataModel.checkIfSwitchShiftMade(form.getAgentDayId());						//check if the break in candidate table
		checkIfAllowReplace(form) ;						//check that the user allowed for replace
	}
	
	
	public static void checkIfBreakTooClose(BreakBean form) throws ShfException {
		logger.debug("Starting checkIfBreakTooClose()");
		String minBeforeBreak=SHFParameters.getMinHoursBeforeSwitchBreak(form.getAllowedMoked()).getValue();
		long num=Long.parseLong(minBeforeBreak);
		
		if(form.getStartTime().getTime() - (num*60*1000) < new Date().getTime()){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.breakTimeClose", minBeforeBreak));					
			throw new ShfException(actionErrors);
		}
	}
	
	public static void checkIfBreakExist(BreakBean form) throws ShfException {
		logger.debug("Starting checkIfBreakExist()");
		//check if the break is allready in the candidate table
		int param_index=1;
		
		String startDateS = null;
		
		startDateS = BaseConvert.dateToString(form.getStartTime(),"dd/MM/yyyy HH:mm");
		StringBuffer sSql=new StringBuffer();
		
		sSql.append("SELECT * ");
		sSql.append("FROM SHIFTER.SHF_REPLACE_BREAK_CANDIDATES R ");
		sSql.append("WHERE R.SHF_EMPLOYEE_DAY_ID = ? ");
		sSql.append("AND R.BREAK_START = TO_DATE( ? ,'DD/MM/YYYY HH24:MI') ");
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			
			db.setLong(param_index++, form.getAgentDayId());
			db.setString(param_index++, startDateS);
	
			db.executeQuery();
			if(db.next()) { 
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.breakCandidateExist", null));					
				throw new ShfException(actionErrors); } 

		} catch(DBQueryNoRowsException e){
		
		} catch (DBException e) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		//		logger.error("Attendance.get att list(): no rows returned " + e);
				throw new ShfException(actionErrors);
			} finally{
				try {
					db.close();
				} catch (DBException e) {
					logger.error("error in checkIfBreakExist() while closing db connection: "+e.getMessage());
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
					throw new ShfException(actionErrors);
				}
			}			
		}
		
		
	public boolean checkBreakSource(BreakBean form) throws ShfException {
		logger.debug("Starting checkBreakSource()");
		boolean retBool=false;
		int param_index=1;

		String startDateS = null;
		
		startDateS = BaseConvert.dateToString(form.getStartTime(),"dd/MM/yyyy HH:mm");
		StringBuffer sSql=new StringBuffer();
		
		sSql.append("SELECT * ");
		sSql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS E ");
		sSql.append("WHERE E.AGENT_DAY_ID = ? ");
		sSql.append("AND E.STATE_TYPE = ? ");
		sSql.append("AND E.START_TIME = TO_DATE( ? ,'DD/MM/YYYY HH24:MI') ");
		sSql.append("AND E.SOURCE <> 'WFM' ");
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			
			db.setLong(param_index++, form.getAgentDayId());
			db.setInt(param_index++, SHFConstants.STATE_BREAK);				
			db.setString(param_index++, startDateS);
	
			db.executeQuery();
			if(db.next()) { 
				retBool=false;
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.breakSourceNotAllowed", null));					
				throw new ShfException(actionErrors); } 

		} catch(DBQueryNoRowsException e){
			retBool=true;
			} catch (DBException e) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		//		logger.error("Attendance.get att list(): no rows returned " + e);
				throw new ShfException(actionErrors);
			} finally{
				try {
					db.close();
				} catch (DBException e) {
					logger.error("error in checkBreakSource() while closing db connection: "+e.getMessage());
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
					throw new ShfException(actionErrors);
				}
			}		
		return retBool;	
		}
		
		
	public void checkIfAllowReplace(BreakBean form) throws ShfException {
		logger.debug("Starting checkIfAllowReplace() dayId = " + form.getAgentDayId());
		EmployeeDataModel.checkIfShiftAllowedForReplace(form.getAgentDayId());
	}
	
	
	public Vector<BreakCandidateBean> checkCandidate(ShiftDataForm shiftForm, BreakBean form) throws ShfException{
		logger.debug("Starting checkCandidate() ");
		Vector<BreakCandidateBean> retVec=new Vector<BreakCandidateBean>();
		Vector<BreakCandidateBean> tempBreak = new Vector<BreakCandidateBean>();
		BreakCandidateBean breakCaBean = null;
		long checkWithDayId = form.getAgentDayId();
		Date checkWithStartDate = form.getStartTime();
		Date checkWithEndDate = form.getEndTime();
		
		tempBreak = populateBreakCandidate(shiftForm, form); 
		// select all the candidate that are match to me
		
		Iterator<BreakCandidateBean> it = tempBreak.iterator();
		
		while (it.hasNext()) {
			breakCaBean = (BreakCandidateBean)it.next();
			if (checkGapBetweenBreakCandidateAndShift(breakCaBean, checkWithDayId, checkWithStartDate, checkWithEndDate)) 
			{
				retVec.add(breakCaBean);
			} 
		}
		
		return retVec;
	}
	
	
	public Vector<BreakCandidateBean> populateBreakCandidate(ShiftDataForm shiftForm, BreakBean form) throws ShfException{
		logger.debug("Starting populateBreakCandidate() ");
		
		Vector<BreakCandidateBean> retVvec=new Vector<BreakCandidateBean>();
		int param_index=1;

		StringBuffer sSql=new StringBuffer();

		sSql.append("SELECT T.*, ");
		sSql.append("X.AGENT_DAY_ID, "); 
		sSql.append("X.START_TIME,  ");
		sSql.append("X.END_TIME,  ");
		sSql.append("X.DURATION,  ");
		sSql.append("E.EMPLOYEE_ID, ");
		sSql.append("E.ORG_UNIT_ID, ");
		sSql.append("E.FIRST_NAME, ");
		sSql.append("E.LAST_NAME, ");
		sSql.append("E.INNER_JOB_ID, ");
		sSql.append("C.NEW_ACTIVITY, ");
		sSql.append("D.WM_SCH_ACTIVITY_ID_DATA ");
		sSql.append("FROM SHIFTER.SHF_REPLACE_BREAK_CANDIDATES T ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_EXCEPTIONS X ON (X.AGENT_DAY_ID=T.SHF_EMPLOYEE_DAY_ID AND X.START_TIME=T.BREAK_START) ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY D ON T.SHF_EMPLOYEE_DAY_ID=D.SHF_EMPLOYEE_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON C.SHF_EMPLOYEE_DAY_ID=D.SHF_EMPLOYEE_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES E ON SUBSTR(E.EMP_ID_NUMBER,1,8) = NVL(C.NEW_EMPLOYEE_ID,D.EMP_ID_NUMBER) ");

		sSql.append(" WHERE T.STATUS= ? ");  // 1
		sSql.append(" AND D.WM_SITE_ID = ? ");  // 2

		sSql.append("AND SUBSTR(E.EMP_ID_NUMBER,1,8) <> ? ");  // 3
		
		//sSql.append("AND REPLACE(NVL(C.NEW_ACTIVITY,D.WM_SCH_ACTIVITY_ID_DATA),';','') = ? "); //  4 CHECK FOR THE SAME ACTIVITY
 
		sSql.append(" AND X.START_TIME >= SYSDATE + ? /1440 "); //  5 (/24) CHECK THE MINMUM TIME OF BREAKS START TO ALOWED CHANGE
		sSql.append(" AND X.DURATION= ? "); // 6 CHECK FOR THE SAME DURATION
		sSql.append(" AND NVL(C.NEW_DAY_TYPE, D.WM_DAY_TYPE) = 4  "); //    CHECK FOR REGULAR SHIFT
		sSql.append(" AND X.STATE_TYPE = ?  "); // 7   CHECK THAT THE STATE_TYPE IS FOR BREAKS
		sSql.append(" AND X.START_TIME 	>= ( ? + 1/24 )"); // 8  SHIFT START +1H  CHECK FOR MINIMUM LENGTH BETWEEN SHIFT START AND NEW BREAK CANDIDATE START
		sSql.append(" AND X.END_TIME 	<= ( ? - 1/24 )"); // 9 SHIFT END - 1H  CHECK FOR MINIMUM LENGTH BETWEEN SHIFT END AND NEW BREAK CANDIDATE END

		//VALIDATE THAT THE GAP BETWEEN BREAKS WILL BE AT LIST 1H
		sSql.append(" AND (SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS G WHERE G.AGENT_DAY_ID= ?  ");// 10  MY SHIFT ID
		sSql.append(" AND G.START_TIME <> TO_DATE( ? ,'DD/MM/YYYY HH24:MI') "); // 11  MY SWITCHED BREAK START
		sSql.append(" AND G.STATE_TYPE = ?  "); // 12   CHECK THAT THE STATE_TYPE IS FOR BREAKS
		//sSql.append(" AND ( ( ABS( (G.START_TIME-X.START_TIME)*24*60) - G.DURATION < 60 )  )  ");
		//sSql.append("	 ) = 0 ");
		sSql.append(" AND (( ABS( (G.START_TIME-X.END_TIME)*24*60)  < 60 ) or ( ABS( (X.START_TIME-G.END_TIME)*24*60)  < 60 )) ) = 0");

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			db.setString(param_index++, SHFConstants.STATUS_OPEN);  // 1
			
			db.setString(param_index++, shiftForm.getSiteId()); // 2
			
			db.setString(param_index++, shiftForm.getEmpIdNumber()); // 3 
			
			//db.setString(param_index++,SHFTableUtils.getActivityCodeWithoutColon(shiftForm.getShiftActivity())); // 4 
			
			String moked=SHFTableUtils.getMokedCodeOf(shiftForm.getOrgUnitCode());
			
			db.setInt(param_index++, Integer.parseInt(SHFParameters.getMinHoursBeforeSwitchBreak(moked).getValue())); // 5
			
			db.setInt(param_index++, form.getDuration());// 6
			
			db.setInt(param_index++, SHFConstants.STATE_BREAK); // 7 state break test
			
			db.setTimestamp(param_index++, shiftForm.getShiftStart()); // 8
			
			db.setTimestamp(param_index++, shiftForm.getShiftEnd()); // 9 
			
			db.setLong(param_index++, form.getAgentDayId()); // 10
			
			db.setString(param_index++, BaseConvert.dateToString(form.getStartTime(), "dd/MM/yyyy HH:mm") ); // 11 

			db.setInt(param_index++, SHFConstants.STATE_BREAK); // 12 state break test
						
			BreakCandidateBean breakCaBean = new BreakCandidateBean();
			db.executeQuery();
			while(db.next()){
				breakCaBean = new BreakCandidateBean();
				db.populate(breakCaBean);
				
				
				if(breakCaBean!=null && breakCaBean.getInnerJobId()!=null){
					if(SHFTableUtils.isInnerJobsSwitchable(breakCaBean.getInnerJobId() , shiftForm.getInnerJobId() )){
						retVvec.add(breakCaBean);
					} 
				}
				
				
			}

	} catch(DBQueryNoRowsException e){
	
	} catch (DBException e) {
		logger.error("error in populateBreakCandidate: " + e.getMessage());
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
		throw new ShfException(actionErrors);
	} finally{
		try {
			db.close();
		} catch (DBException e) {
			logger.error("error in populateBreakCandidate while closing db: " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
	}
	return retVvec;
	}	
	
	public static Vector<BreakCandidateBean> populateBreakCandidatesByDayVec( Vector<AgentDayBean> allShifts ) throws ShfException{
		logger.debug("Starting populateBreakCandidatesByDayVec()");
		if ( allShifts == null ) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		Vector<BreakCandidateBean> result = null;
		
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHF_EMPLOYEE_DAY_ID FROM SHIFTER.SHF_REPLACE_BREAK_CANDIDATES c WHERE c.SHF_EMPLOYEE_DAY_ID in ( ");
		int k = 0;
		for (int i = 0; i < allShifts.size(); i++) {
			if (k == 998) {	// oracle ORA-01795 - 1000 limit
				k = 0;
				sql.append(" ) \n OR c.SHF_EMPLOYEE_DAY_ID IN ( "+allShifts.get(i).getAgentDayId());
				if (i < allShifts.size() - 1 ) {
					sql.append(",");
				}
				continue;
			}
			sql.append( allShifts.get(i).getAgentDayId() );
			if (i < allShifts.size() - 1 && k < 997) {
				sql.append(",");
			}
			k++;
		}
		sql.append(" ) ");
		
		DBAccess db = null;
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			db.executeQuery();
			result = new Vector<BreakCandidateBean>();
			db.populate("bzq.shf.bean.BreakCandidateBean",result);
			
		} catch(DBQueryNoRowsException e){

		} catch (DBException e) {
			logger.error("error in checkIfSwitchBreakMade() : "+e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e){
				logger.error("error in checkIfSwitchBreakMade() while closing db connection : "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return result;
	}
	
	public static boolean checkGapBetweenBreaksAndShift(long replacedBreakAgentDay,Date replacedBreakStart, long checkWithDayId, Date checkWithStartDate, Date checkWithEndDate) throws ShfException{
		logger.debug("Starting checkGapBetweenBreaksAndShift()");
		int param_index=1;

		
		boolean retVal = false;
	
		StringBuffer sSql=new StringBuffer();

		sSql.append("SELECT T.*, ");
		sSql.append("X.AGENT_DAY_ID, "); 
		sSql.append("X.START_TIME,  ");
		sSql.append("X.END_TIME,  ");
		sSql.append("X.DURATION,  ");
		sSql.append("E.EMPLOYEE_ID, ");
		sSql.append("E.ORG_UNIT_ID, ");
		sSql.append("E.FIRST_NAME, ");
		sSql.append("E.LAST_NAME, ");
		sSql.append("C.NEW_ACTIVITY, ");
		sSql.append("D.WM_SCH_ACTIVITY_ID_DATA ");
		sSql.append("FROM SHIFTER.SHF_REPLACE_BREAK_CANDIDATES T ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_EXCEPTIONS X ON (X.AGENT_DAY_ID=T.SHF_EMPLOYEE_DAY_ID AND X.START_TIME=T.BREAK_START) ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY D ON T.SHF_EMPLOYEE_DAY_ID=D.SHF_EMPLOYEE_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES C ON C.SHF_EMPLOYEE_DAY_ID=D.SHF_EMPLOYEE_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES E ON SUBSTR(E.EMP_ID_NUMBER,1,8) = NVL(C.NEW_EMPLOYEE_ID,D.EMP_ID_NUMBER) ");


		sSql.append(" WHERE D.SHF_EMPLOYEE_DAY_ID =  ? "); // 1 DAY ID OF THE OTHER USER I AM CHEKING WITH
		sSql.append(" AND X.STATE_TYPE = ?  "); // 2   CHECK THAT THE STATE_TYPE IS FOR BREAKS
		sSql.append(" AND to_date(?,'dd/MM/yyyy HH24:mi') - 1/24 >= NVL(C.NEW_SHIFT_START, D.WM_SHIFT_START_DATETIME) "); // 3 shift start +1h  check for minimum length between break candidate start and  shift start  
		sSql.append(" AND to_date(?,'dd/MM/yyyy HH24:mi') + 1/24 <= NVL(C.NEW_SHIFT_END, D.WM_SHIFT_END_DATETIME) ");  // 4 shift end - 1h  check for minimum length between break candidate end and shift end
	
		//VALIDATE THAT THE GAP BETWEEN BREAKS WILL BE AT LIST 1H
		sSql.append(" AND ( (SELECT COUNT(*) FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS G WHERE G.AGENT_DAY_ID = ?   "); // 5 OTHER SHIFT ID
		sSql.append(" AND G.START_TIME <>  ?  "); // 6 OTHER SWITCHED BREAK
		sSql.append(" AND G.STATE_TYPE = ?  "); //  7  CHECK THAT THE STATE_TYPE IS FOR BREAKS		
		sSql.append(" AND ( ABS( (G.START_TIME-to_date(?,'dd/MM/yyyy HH24:mi'))*24*60) < 60 or ABS( (to_date(?,'dd/MM/yyyy HH24:mi')-G.END_TIME)*24*60) < 60) )= 0 )"); // 8,9  candiate start time,end time
		
		DBAccess db=null;
			try {
				db=new DBAccess();
				db.prepareStatement(sSql.toString());
					
				db.setLong(param_index++, replacedBreakAgentDay); // 1
	
				db.setInt(param_index++, SHFConstants.STATE_BREAK); // 2 state break test
						
				db.setString(param_index++, BaseConvert.dateToString(checkWithStartDate, "dd/MM/yyyy HH:mm")); //3
			
				db.setString(param_index++, BaseConvert.dateToString(checkWithEndDate, "dd/MM/yyyy HH:mm")); //4			
	
				db.setLong(param_index++, replacedBreakAgentDay); // 5
			
				db.setTimestamp(param_index++, replacedBreakStart); //6
	
				db.setInt(param_index++, SHFConstants.STATE_BREAK); // 7 state break test
				
				db.setString(param_index++, BaseConvert.dateToString(checkWithEndDate, "dd/MM/yyyy HH:mm")); //8
				db.setString(param_index++, BaseConvert.dateToString(checkWithStartDate, "dd/MM/yyyy HH:mm")); //9
			
				new BreakCandidateBean();
	
				db.executeQuery();
				if(db.next()){
					retVal = true;
				}
	
		} catch(DBQueryNoRowsException e){
				retVal = false;
		} catch (DBException e) {
			logger.error("error in checkGapBetweenBreakCandidateAndShift: " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error in checkGapBetweenBreakCandidateAndShift while closing db: " + e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}
		return retVal;
	}	
		
	public static boolean checkGapBetweenBreakCandidateAndShift(BreakCandidateBean breakCaBean, long checkWithDayId, Date checkWithStartDate, Date checkWithEndDate) throws ShfException{
		logger.debug("Starting checkGapBetweenBreakCandidateAndShift()");
		return checkGapBetweenBreaksAndShift(breakCaBean.getAgentDayId(),breakCaBean.getBreakStart(),checkWithDayId,checkWithStartDate,checkWithEndDate);
	}	
	
	public Vector populateBreakOffer(BreakBean form) throws ShfException{
		logger.debug("Starting populateBreakOffer() ");
		//change to shipurim - yuval 10.04.2010
		
		Vector<BreakCandidateBean> retVvec=new Vector<BreakCandidateBean>();
		int param_index=1;
		
		String startDateS = null;
		
		startDateS = BaseConvert.dateToString(form.getStartTime(),"dd/MM/yyyy HH:mm");
		
		StringBuffer sSql=new StringBuffer();
	
		sSql.append(" ( ");
		sSql.append("SELECT  A.AGENT_DAY_ID, A.START_TIME,  A.END_TIME,  A.DURATION,  ");
        sSql.append("F.STATUS, F.MODIFIED_DATE, F.OFFER_DAY_ID, F.OFFER_START_DATE,  ");
        sSql.append("B.EMPLOYEE_ID, B.ORG_UNIT_ID, B.FIRST_NAME, B.LAST_NAME, B.EMP_ID_NUMBER,  ");
        sSql.append("NULL AS NEW_ACTIVITY,  ");
        sSql.append("C.WM_SCH_ACTIVITY_ID_DATA  ");
  		sSql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A "); 
       	sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID "); 
       	sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = C.EMP_ID_NUMBER ");
       	sSql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID   ");
       	sSql.append("RIGHT JOIN SHIFTER.SHF_REPLACE_BREAK_CANDIDATES F ON F.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID "); 
       	sSql.append("AND F.BREAK_START = A.START_TIME  ");
 		sSql.append("WHERE STATUS = ? ");
       	sSql.append("AND OFFER_DAY_ID = ?  ");
       	sSql.append("AND OFFER_START_DATE = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' ) "); 
       	sSql.append("and c.shf_employee_day_id  in  ");
        sSql.append(" (select d.shf_employee_day_id from SHIFTER.shf_employee_day d  minus select c.shf_employee_day_id "); 
        sSql.append(" from shifter.shf_day_changes c) ");
		sSql.append(") ");
		sSql.append(" UNION ALL ");
		sSql.append("( ");
		sSql.append(" SELECT  A.AGENT_DAY_ID, A.START_TIME,  A.END_TIME,  A.DURATION, ");  
        sSql.append("F.STATUS, F.MODIFIED_DATE, F.OFFER_DAY_ID, F.OFFER_START_DATE, "); 
        sSql.append("B.EMPLOYEE_ID, B.ORG_UNIT_ID, B.FIRST_NAME, B.LAST_NAME, B.EMP_ID_NUMBER, "); 
        sSql.append("E.NEW_ACTIVITY, "); 
        sSql.append("E.NEW_ACTIVITY ");
  		sSql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A "); 
       	sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID "); 
       	sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = E.NEW_EMPLOYEE_ID ");
       	sSql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID ");  
       	sSql.append("RIGHT JOIN SHIFTER.SHF_REPLACE_BREAK_CANDIDATES F ON F.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID "); 
       	sSql.append("AND F.BREAK_START = A.START_TIME "); 
 		sSql.append("WHERE STATUS = ? ");
       	sSql.append("AND OFFER_DAY_ID = ? "); 
       	sSql.append("AND OFFER_START_DATE = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' ) "); 
       	sSql.append("AND E.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID ");
		sSql.append(") ");
		
/*		OLD SQL
		sSql.append("SELECT  ");
		sSql.append("A.AGENT_DAY_ID, "); 
		sSql.append("A.START_TIME,  ");
		sSql.append("A.END_TIME,  ");
		sSql.append("A.DURATION,  ");
		sSql.append("F.STATUS, ");
		sSql.append("F.MODIFIED_DATE, ");
		sSql.append("F.OFFER_DAY_ID, ");
		sSql.append("F.OFFER_START_DATE, ");
		sSql.append("B.EMPLOYEE_ID, ");
		sSql.append("B.ORG_UNIT_ID, ");
		sSql.append("B.FIRST_NAME, ");
		sSql.append("B.LAST_NAME, ");		
		sSql.append("E.NEW_ACTIVITY, ");
		sSql.append("C.WM_SCH_ACTIVITY_ID_DATA ");
		sSql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A "); 
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID "); 
		sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.SHF_EMPLOYEE_DAY_ID=A.AGENT_DAY_ID  ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = NVL(E.NEW_EMPLOYEE_ID,C.EMP_ID_NUMBER) ");  
		sSql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID  ");
		sSql.append("RIGHT JOIN SHIFTER.SHF_REPLACE_BREAK_CANDIDATES F ON F.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID AND F.BREAK_START = A.START_TIME ");
		sSql.append("WHERE STATUS = ? ");
		sSql.append("AND OFFER_DAY_ID = ? ");
		sSql.append("AND OFFER_START_DATE = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' ) ");

*/
		
		DBAccess db=null;
		try {
			db=new DBAccess();	
			db.prepareStatement(sSql.toString());
			
			//SELECT - 1
			db.setString(param_index++, SHFConstants.STATUS_WAIT);
			db.setLong(param_index++, form.getAgentDayId());
			db.setString(param_index++, startDateS);
			
			//SELECT - 2
			db.setString(param_index++, SHFConstants.STATUS_WAIT);
			db.setLong(param_index++, form.getAgentDayId());
			db.setString(param_index++, startDateS);
			
			BreakCandidateBean breakCaBean = new BreakCandidateBean();
			new Vector();

			db.executeQuery();
			while(db.next()){
				breakCaBean = new BreakCandidateBean();
				db.populate(breakCaBean);
				
				if(breakCaBean!=null ){
					retVvec.add(breakCaBean);
					} 
			}

	} catch(DBQueryNoRowsException e){
	
	} catch (DBException e) {
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
//		logger.error("Attendance.get att list(): no rows returned " + e);
		throw new ShfException(actionErrors);
	} finally{
		try {
			db.close();
		} catch (DBException e) {
			throw new ShfException("dBAccess.close()", e);
		}
	}
	return retVvec;
	}
	
	public void insertBreakAsCandidate(BreakBean breakInfo)throws ShfException {
		logger.debug("Starting insertBreakAsCandidate() dayId = " + breakInfo.getAgentDayId());
		//insert the break who asked for replace
		
		StringBuffer sSql=new StringBuffer();
		int param_index=1;

		sSql.append("INSERT INTO SHIFTER.SHF_REPLACE_BREAK_CANDIDATES ( ");
		sSql.append("SHF_EMPLOYEE_DAY_ID,  ");
		sSql.append("BREAK_START,  ");
		sSql.append("CREATION_DATE,  ");
		sSql.append("STATUS,  ");
		sSql.append("ERR_REASON,  ");
		sSql.append("MODIFIED_DATE,  ");
		sSql.append("OFFER_DAY_ID, ");
		sSql.append("OFFER_START_DATE ) ");
		sSql.append("VALUES(? , ? , ?, ?, NULL, ?, NULL, NULL ) ");
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			db.setLong(param_index++, breakInfo.getAgentDayId());
			db.setTimestamp(param_index++, breakInfo.getStartTime());
			db.setTimestamp(param_index++, new Date());
			db.setString(param_index++, SHFConstants.STATUS_OPEN);
			db.setTimestamp(param_index++, new Date());

			db.executeUpdate();
		} catch(DBUpdateNoRowsException e){ 
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailed",null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("dBAccess.close()", e);
			}
		}	
		
	}
	
	public void insertBreakAsCandidateOffer(BreakCandidateBean breakInfo)throws ShfException {
		logger.debug("Starting insertBreakAsCandidateOffer() dayId = " + breakInfo.getAgentDayId());
		//insert the break who asked for replace

		
		StringBuffer sSql=new StringBuffer();
		int param_index=1;

		sSql.append("INSERT INTO SHIFTER.SHF_REPLACE_BREAK_CANDIDATES ( ");
		sSql.append("SHF_EMPLOYEE_DAY_ID,  ");
		sSql.append("BREAK_START,  ");
		sSql.append("CREATION_DATE,  ");
		sSql.append("STATUS,  ");
		sSql.append("ERR_REASON,  ");
		sSql.append("MODIFIED_DATE,  ");
		sSql.append("OFFER_DAY_ID, ");
		sSql.append("OFFER_START_DATE ) ");
		sSql.append("VALUES(? , ? , ?, ?, NULL, ?, ?, ? ) ");
		
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			
			db.setLong(param_index++, breakInfo.getAgentDayId());
			db.setTimestamp(param_index++, breakInfo.getStartTime());
			db.setTimestamp(param_index++, new Date());
			db.setString(param_index++, SHFConstants.STATUS_WAIT);
			db.setTimestamp(param_index++, new Date());
			db.setLong(param_index++, breakInfo.getOfferDayId());
			db.setTimestamp(param_index++, breakInfo.getOfferStartDate());

			db.executeUpdate();
		} catch(DBUpdateNoRowsException e){ 
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailed",null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("dBAccess.close()", e);
			}
		}	
		
	}	
	public void updateBreakForChange(BreakCandidateBean breakInfo)throws ShfException {
		logger.debug("Starting updateBreakForChange() ");

		StringBuffer sSql=new StringBuffer();
		int param_index=1;
		
		String myStartDate = BaseConvert.dateToString(breakInfo.getStartTime(),"dd/MM/yyyy HH:mm");
		String canStartDate = BaseConvert.dateToString(breakInfo.getOfferStartDate(),"dd/MM/yyyy HH:mm");
		String currentDate = BaseConvert.dateToString(new Date(),"dd/MM/yyyy HH:mm");
		
		sSql.append("UPDATE SHIFTER.SHF_REPLACE_BREAK_CANDIDATES ");
		sSql.append("SET OFFER_DAY_ID = ?, OFFER_START_DATE = TO_DATE( ? ,'DD/MM/YYYY HH24:MI'), ");
		sSql.append("MODIFIED_DATE = TO_DATE( ? ,'DD/MM/YYYY HH24:MI'), STATUS =   ?  ");
//		sSql.append("STATUS =   ?  , MODIFIED_DATE = TO_DATE( ? ,'DD/MM/YYYY HH24:MI') ");
		sSql.append("WHERE SHF_EMPLOYEE_DAY_ID = ? ");
		sSql.append("AND BREAK_START = TO_DATE( ? ,'DD/MM/YYYY HH24:MI') ");


		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			
			db.setLong(param_index++, breakInfo.getOfferDayId());
			
			db.setString(param_index++, canStartDate);
			
			db.setString(param_index++, currentDate);

			db.setString(param_index++, SHFConstants.STATUS_WAIT);
			
			db.setLong(param_index++, breakInfo.getAgentDayId());
			
			db.setString(param_index++, myStartDate);

			db.executeUpdate();
		} catch(DBUpdateNoRowsException e){ 
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailed",null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("dBAccess.close()", e);
			}
		}	
		
	}

	/**
	 * @param breakCaBean
	 * @param string
	 */
	public void updateExceptionSource(long dayId, Date startDate, String source) throws ShfException{
		logger.debug("Starting updateExceptionSource() dayId = "+ dayId);
		
		StringBuffer sSql=new StringBuffer();
		int param_index=1;
		
		String myStartDate = BaseConvert.dateToString(startDate,"dd/MM/yyyy HH:mm");
		
		sSql.append("UPDATE SHIFTER.SHF_EMPLOYEE_EXCEPTIONS T ");
		sSql.append("SET T.SOURCE=? ");
		sSql.append("WHERE T.AGENT_DAY_ID = ? "); 
		sSql.append("AND T.START_TIME = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' ) ");

		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());

			db.setString(param_index++, source);
			db.setLong(param_index++, dayId);
			db.setString(param_index++, myStartDate);
			
			db.executeUpdate();
		} catch(DBUpdateNoRowsException e){ 
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailed",null));
			throw new ShfException(actionErrors);
		} catch (DBException e) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
				throw new ShfException(actionErrors);
			}
		}	
		
	}
	
	public Vector populateCandidateForManage(String userId,BreakCandidateBean form) throws ShfException{
		logger.debug("Starting populateCandidateForManage()");
		Vector vec=populateCandidateForManageWithoutCaDetails(userId,form);
		BreakCandidateBean offerCanBean=null;
		BreakCandidateBean breakCanBean = null;
		if(vec!=null && vec.size()>0){
			for(int i=0;i<vec.size();i++){
				breakCanBean=(BreakCandidateBean)vec.get(i);
				if(breakCanBean.getOfferDayId()>0){
					offerCanBean = getBreakCandidateDetails(breakCanBean.getOfferDayId(), breakCanBean.getOfferStartDate());
					breakCanBean.setOfferCaDetails(offerCanBean);
				}
			}
		}
		return vec;
	}
	
	
	public Vector populateCandidateForManageWithoutCaDetails(String userId,BreakCandidateBean form) throws ShfException{
		logger.debug("Starting populateCandidateForManageWithoutCaDetails()");
		int param_index=1;
		Vector resVec = new Vector();

	
		StringBuffer sSql=new StringBuffer();
		
		sSql.append("SELECT  ");
		sSql.append("A.AGENT_DAY_ID, "); 
		sSql.append("A.START_TIME,  ");
		sSql.append("A.END_TIME,  ");
		sSql.append("A.DURATION,  ");
		sSql.append("F.STATUS, ");
		sSql.append("F.MODIFIED_DATE, ");
		sSql.append("F.OFFER_DAY_ID, ");
		sSql.append("F.OFFER_START_DATE, ");
		sSql.append("B.EMPLOYEE_ID, ");
		sSql.append("B.ORG_UNIT_ID, ");
		sSql.append("B.FIRST_NAME, ");
		sSql.append("B.LAST_NAME, ");	
		sSql.append("B.EMP_ID_NUMBER, ");
		sSql.append("E.NEW_ACTIVITY, ");
		sSql.append("C.WM_SCH_ACTIVITY_ID_DATA ");
		sSql.append("FROM SHIFTER.SHF_REPLACE_BREAK_CANDIDATES F  ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A ON F.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID AND F.BREAK_START = A.START_TIME "); 
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID "); 
		sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.SHF_EMPLOYEE_DAY_ID=A.AGENT_DAY_ID  ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = NVL(E.NEW_EMPLOYEE_ID,C.EMP_ID_NUMBER) ");  
		sSql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT U ON U.ORG_UNIT_ID = B.ORG_UNIT_ID  ");
		sSql.append("WHERE B.EMPLOYEE_ID > 0 AND A.CANCEL_REASON_CODE is null ");
		if(userId!=null){
			sSql.append("AND B.EMP_ID_number = ? ");
		}
		sSql.append("AND A.STATE_TYPE  = 4  ");
		sSql.append("AND A.START_TIME > sysdate ");
		sSql.append("ORDER BY A.START_TIME ");
			
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());	
			
			if(userId!=null){
				db.setString(param_index++, ((BreakCandidateBean)form).getUserId());
			}
			db.executeQuery();
			
			BreakCandidateBean breakCanBean = null;
			
			while(db.next()){
				breakCanBean = new BreakCandidateBean();
				db.populate(breakCanBean);
				
				if(breakCanBean!=null ){
					resVec.add(breakCanBean);
				} 
			}
	} catch(DBQueryNoRowsException e){
	
	} catch (DBException e) {
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.populateFailed", null));
		throw new ShfException(actionErrors);
	} finally{
		try {
			db.close();
		} catch (DBException e) {
			throw new ShfException("dBAccess.close()", e);
		}
	}			
	return resVec;	
	}
	
	public BreakCandidateBean getBreakCandidateDetails(long dayId, Date startTime) throws ShfException{
		logger.debug("Starting getBreakCandidateDetails() dayId = " + dayId);
		new Vector();
		int param_index=1;

		String startDateS = null;
		BreakCandidateBean breakCaBean = new BreakCandidateBean();
		
		startDateS = BaseConvert.dateToString(startTime,"dd/MM/yyyy HH:mm");
		
		StringBuffer sSql=new StringBuffer();
	
		sSql.append("SELECT ");
		sSql.append("A.AGENT_DAY_ID, ");
		sSql.append("A.START_TIME, ");  
		sSql.append("A.END_TIME, ");
		sSql.append("A.DURATION, ");
		sSql.append("F.STATUS, ");
		sSql.append("F.MODIFIED_DATE, "); 
		sSql.append("F.OFFER_DAY_ID, ");
		sSql.append("F.OFFER_START_DATE, ");
		sSql.append("B.EMPLOYEE_ID, ");
		sSql.append("B.ORG_UNIT_ID, ");
		sSql.append("B.FIRST_NAME, ");
		sSql.append("B.LAST_NAME, ");
		sSql.append("E.NEW_ACTIVITY, ");
		sSql.append("C.WM_SCH_ACTIVITY_ID_DATA "); 
		sSql.append("FROM SHIFTER.SHF_EMPLOYEE_EXCEPTIONS A ");  
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEE_DAY C ON C.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID ");  
		sSql.append("LEFT JOIN SHIFTER.SHF_DAY_CHANGES E ON E.SHF_EMPLOYEE_DAY_ID=A.AGENT_DAY_ID ");
		sSql.append("LEFT JOIN SHIFTER.SHF_EMPLOYEES B ON SUBSTR(B.EMP_ID_NUMBER,1,8) = NVL(E.NEW_EMPLOYEE_ID,C.EMP_ID_NUMBER) ");   
		sSql.append("LEFT JOIN SHIFTER.SHF_ORG_UNIT D ON D.ORG_UNIT_ID = B.ORG_UNIT_ID ");
		sSql.append("RIGHT JOIN SHIFTER.SHF_REPLACE_BREAK_CANDIDATES F ON F.SHF_EMPLOYEE_DAY_ID = A.AGENT_DAY_ID AND F.BREAK_START = A.START_TIME "); 
		sSql.append("WHERE A.AGENT_DAY_ID  = ? AND A.CANCEL_REASON_CODE is null ");
		sSql.append("AND A.START_TIME = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' ) ");
		sSql.append("AND A.STATE_TYPE  = 4 ");


		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sSql.toString());
			
			db.setLong(param_index++, dayId);
			db.setString(param_index++, startDateS);
			db.executeQuery();
			if(db.next()){
				breakCaBean = new BreakCandidateBean();
				db.populate(breakCaBean);
			}

	} catch(DBQueryNoRowsException e){
	
	} catch (DBException e) {
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
//		logger.error("Attendance.get att list(): no rows returned " + e);
		throw new ShfException(actionErrors);
	} finally{
		try {
			db.close();
		} catch (DBException e) {
			throw new ShfException("dBAccess.close()", e);
		}
	}
	return breakCaBean;
	}
	
	
	/**
	 * @param shiftForm
	 */
	public void deleteBreakCandidate(BreakCandidateBean breakCaBean) throws ShfException {
		logger.debug("Starting deleteBreakCandidate()");

		String startDateS=null;
		startDateS = BaseConvert.dateToString(breakCaBean.getStartTime(),"dd/MM/yyyy HH:mm");
		
		String sql="DELETE FROM SHIFTER.SHF_REPLACE_BREAK_CANDIDATES " +
					"WHERE SHF_EMPLOYEE_DAY_ID = ? " +
					"AND BREAK_START = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' )";
		DBAccess db=null;					
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setLong(1,breakCaBean.getAgentDayId());
			db.setString(2,startDateS);
			db.executeUpdate();
	
		}catch(DBUpdateNoRowsException e){ 

		}catch (DBException e) {
			e.printStackTrace();
			throw new ShfException("", e);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("dBAccess.close()", e);
			}
		}	
	}
	
	/**
	 * @param shiftForm
	 */
	public Vector rejectAllBreakOffer(BreakCandidateBean breakCaBean) throws ShfException {
		logger.debug("Starting rejectAllBreakOffer() ");
		Vector messagesToSend=null;
		String startDateS=null;
		String startCaS=null;
		
		int param_index=1;
		startDateS = BaseConvert.dateToString(breakCaBean.getStartTime(),"dd/MM/yyyy HH:mm");
		startCaS = BaseConvert.dateToString(breakCaBean.getOfferStartDate(),"dd/MM/yyyy HH:mm");
		String currentDate = BaseConvert.dateToString(new Date(),"dd/MM/yyyy HH:mm");

		DBAccess db=null;
		try {
			db=new DBAccess();
			String sqlSelect =	"SELECT SHF_EMPLOYEE_DAY_ID, BREAK_START " + 
							"FROM SHIFTER.SHF_REPLACE_BREAK_CANDIDATES " + 
							"WHERE OFFER_DAY_ID = ? " + 
							"AND OFFER_START_DATE = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' ) ";
			if (breakCaBean.getOfferDayId() != 0) {
				sqlSelect = sqlSelect + "AND SHF_EMPLOYEE_DAY_ID <> ? " + 
						"AND BREAK_START <> TO_DATE( ? , 'DD/MM/YYYY HH24:MI' ) ";
			}
			db.prepareStatement(sqlSelect);
			db.setLong(param_index++,breakCaBean.getAgentDayId());
			db.setString(param_index++,startDateS);
			if (breakCaBean.getOfferDayId() != 0) {			
				db.setLong(param_index++,breakCaBean.getOfferDayId());
				db.setString(param_index++,startCaS);
			}	
			
			db.executeQuery();
			BreakCandidateBean breakBeanSelect = new BreakCandidateBean();
			BreakCandidateBean breakBeanSend = new BreakCandidateBean();
			messagesToSend=new Vector();
			while(db.next()){
				breakBeanSelect = new BreakCandidateBean();
				breakBeanSend = new BreakCandidateBean();
				db.populate(breakBeanSelect);

				if(breakBeanSelect!=null ){
					breakBeanSend.setAgentDayId(breakCaBean.getAgentDayId());
					breakBeanSend.setStartTime(breakCaBean.getStartTime());
					
					breakBeanSend.setOfferDayId(breakBeanSelect.getEmployeeDayId());
					breakBeanSend.setOfferStartDate(breakBeanSelect.getBreakStart());
					messagesToSend.add(breakBeanSend);
				} 
			}
		
						
		
			param_index=1;
			String sql=	"UPDATE SHIFTER.SHF_REPLACE_BREAK_CANDIDATES " +
					"SET OFFER_DAY_ID=NULL, OFFER_START_DATE=NULL, STATUS = ?, " + 
					"MODIFIED_DATE = TO_DATE( ? ,'DD/MM/YYYY HH24:MI') " +
					"WHERE OFFER_DAY_ID = ? " + 
					"AND OFFER_START_DATE = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' ) ";
				if (breakCaBean.getOfferDayId() != 0) {
					sql = sql + "AND SHF_EMPLOYEE_DAY_ID <> ? " + 
							"AND BREAK_START <> TO_DATE( ? , 'DD/MM/YYYY HH24:MI' ) ";
				}
					
				db.prepareStatement(sql);
				db.setString(param_index++, SHFConstants.STATUS_OPEN);
				db.setString(param_index++, currentDate);
				db.setLong(param_index++,breakCaBean.getAgentDayId());
				db.setString(param_index++,startDateS);
				if (breakCaBean.getOfferDayId() != 0) {			
					db.setLong(param_index++,breakCaBean.getOfferDayId());
					db.setString(param_index++,startCaS);
				}			
				db.executeUpdate();
		
		}catch(DBUpdateNoRowsException e){ 
//			logger.error("No rows to update while break offers reject");
		}catch(DBQueryNoRowsException e){ 
//			e.printStackTrace();
		}catch (DBException e) {
			e.printStackTrace();
			throw new ShfException("", e);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("dBAccess.close()", e);
			}
		}	
		return messagesToSend;
	}

	public void rejectBreakOffer(BreakCandidateBean breakCaBean) throws ShfException {
		logger.debug("Starting rejectBreakOffer() ");

		int param_index=1;
		BaseConvert.dateToString(breakCaBean.getStartTime(),"dd/MM/yyyy HH:mm");
		String currentDate = BaseConvert.dateToString(new Date(),"dd/MM/yyyy HH:mm");
		String canStartDate = BaseConvert.dateToString(breakCaBean.getOfferStartDate(),"dd/MM/yyyy HH:mm");
		
		String sql=	"UPDATE SHIFTER.SHF_REPLACE_BREAK_CANDIDATES " +
					"SET OFFER_DAY_ID=NULL, OFFER_START_DATE=NULL, STATUS = ?, " + 
					"MODIFIED_DATE = TO_DATE( ? ,'DD/MM/YYYY HH24:MI') " +
					"WHERE SHF_EMPLOYEE_DAY_ID = ? " + 
					"AND BREAK_START = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' )";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setString(param_index++, SHFConstants.STATUS_OPEN);
			db.setString(param_index++, currentDate);
			db.setLong(param_index++,breakCaBean.getOfferDayId());
			db.setString(param_index++,canStartDate);
			db.executeUpdate();
	
		}catch(DBUpdateNoRowsException e){ 

		}catch (DBException e) {
			e.printStackTrace();
			throw new ShfException("", e);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("dBAccess.close()", e);
			}
		}	
	}
	
	/**
	 * @param shiftForm
	 */
	public void cancelMyBreakOffer(BreakCandidateBean breakCaBean) throws ShfException {
		logger.debug("Starting cancelMyBreakOffer() ");

		String startDateS=null;
		int param_index=1;
		startDateS = BaseConvert.dateToString(breakCaBean.getStartTime(),"dd/MM/yyyy HH:mm");
		String currentDate = BaseConvert.dateToString(new Date(),"dd/MM/yyyy HH:mm");
		
		String sql=	"UPDATE SHIFTER.SHF_REPLACE_BREAK_CANDIDATES " +
					"SET OFFER_DAY_ID=NULL, OFFER_START_DATE=NULL, STATUS = ?, " + 
					"MODIFIED_DATE = TO_DATE( ? ,'DD/MM/YYYY HH24:MI') " +
					"WHERE shf_employee_day_id = ? " + 
					"AND break_start = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' )";
		DBAccess db=null;
		try {
			db=new DBAccess();
			db.prepareStatement(sql);
			db.setString(param_index++, SHFConstants.STATUS_OPEN);
			db.setString(param_index++, currentDate);
			db.setLong(param_index++,breakCaBean.getAgentDayId());
			db.setString(param_index++,startDateS);
			db.executeUpdate();
	
		}catch(DBUpdateNoRowsException e){ 

		}catch (DBException e) {
			e.printStackTrace();
			throw new ShfException("", e);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("dBAccess.close()", e);
			}
		}	
	}

	/**
	 * @param breakCandidateBean
	 */
	public void switchBetweenBreaks(BreakCandidateBean breakCaBean, ServletContext sCtx) throws ShfException {
		logger.debug("Starting switchBetweenBreaks() ");
		int param_index=1;
		
		String myStartDate = BaseConvert.dateToString(breakCaBean.getStartTime(),"dd/MM/yyyy HH:mm");
		String canStartDate = BaseConvert.dateToString(breakCaBean.getOfferStartDate(),"dd/MM/yyyy HH:mm");
		DBAccess db=null;
		try {		
			db=new DBAccess(false);
			
			String sql=	"UPDATE SHIFTER.SHF_EMPLOYEE_EXCEPTIONS " +
					"SET AGENT_DAY_ID=? " + 
					"WHERE AGENT_DAY_ID = ? " + 
					"AND START_TIME = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' )";
		
			db.prepareStatement(sql);
			db.setLong(param_index++,breakCaBean.getAgentDayId());
			db.setLong(param_index++, breakCaBean.getOfferDayId());
			db.setString(param_index++,canStartDate);
			db.executeUpdate();
			
		
			param_index=1;
			sql=	"UPDATE SHIFTER.SHF_EMPLOYEE_EXCEPTIONS " +
					"SET AGENT_DAY_ID=? " + 
					"WHERE AGENT_DAY_ID = ? " + 
					"AND START_TIME = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' )";
			db.prepareStatement(sql);
			db.setLong(param_index++,breakCaBean.getOfferDayId());
			db.setLong(param_index++, breakCaBean.getAgentDayId());
			db.setString(param_index++,myStartDate);
			db.executeUpdate();	

			param_index=1;
			sql=	"DELETE SHIFTER.SHF_REPLACE_BREAK_CANDIDATES " +
					"WHERE SHF_EMPLOYEE_DAY_ID = ? " + 
					"AND BREAK_START = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' )";
		
			db.prepareStatement(sql);
			db.setLong(param_index++, breakCaBean.getOfferDayId());
			db.setString(param_index++,canStartDate);
			db.executeUpdate();

			param_index=1;
			sql=	"DELETE SHIFTER.SHF_REPLACE_BREAK_CANDIDATES " +
					"WHERE SHF_EMPLOYEE_DAY_ID = ? " + 
					"AND BREAK_START = TO_DATE( ? , 'DD/MM/YYYY HH24:MI' )";
			db.prepareStatement(sql);
			db.setLong(param_index++, breakCaBean.getAgentDayId());
			db.setString(param_index++,myStartDate);
			db.executeUpdate();	
			
//	 		db.commit();	// Managed breaks, commit only if breaks were successfully synchronized with SoftPhone
		}catch(DBUpdateNoRowsException e){ 
			try {
				db.rollback();
			} catch (DBException e1) {
				throw new ShfException("db.rollback()", e);
			}
			e.printStackTrace();
			throw new ShfException("", e);
		}catch (DBException e) {
			try {
				db.rollback();
			} catch (DBException e1) {
				throw new ShfException("db.rollback()", e);
			}
			e.printStackTrace();
			throw new ShfException("", e);
		}/*finally{		// Managed breaks, close later
			try {
				db.close();
			} catch (DBException e) {
				throw new ShfException("dBAccess.close()", e);
			}
		}*/
		
		boolean AcceptIsManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(breakCaBean.getOrgUnitId())).getValue());
//		boolean AcceptIsPilotAgent = SHFConstants.managedBreaksEmpList.contains(breakCaBean.getEmpIdNumber().substring(0, breakCaBean.getEmpIdNumber().length()-1));
		
		boolean OfferIsManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(breakCaBean.getOfferOrgUnitId())).getValue());
//		boolean OfferIsPilotAgent = SHFConstants.managedBreaksEmpList.contains(breakCaBean.getOfferEmpIdNumber().substring(0, breakCaBean.getOfferEmpIdNumber().length()-1));
		
		boolean isManagedBreaks = AcceptIsManagedBreaks || OfferIsManagedBreaks;
//		boolean isPilotAgent = AcceptIsPilotAgent || OfferIsPilotAgent;
		
		boolean transISuccess = true;
		if (isManagedBreaks /*&& isPilotAgent*/) {
			
			bzq.shfsp.request.ObjectFactory of = new bzq.shfsp.request.ObjectFactory();
			SHFSPBreaks breakObject = of.createSHFSPBreaks();
			List<BreakInfo> breakInfoList = breakObject.getBreakInfo();
			
			breakObject.setActionId(SHFConstants.SHF_SP_ACTION_ID_BREAK_UPDATE);
			String userId = breakCaBean.getAllowedActivities().contains("replace_admin") ? breakCaBean.getUserId() : breakCaBean.getEmpIdNumber();
			SHFUtils.setSHFSPMessageDefaults(breakObject);
			breakObject.setUserId(userId);
			
			BreakBean acceptBreak = new BreakBean();
			acceptBreak.setAgentDayId(breakCaBean.getAgentDayId());
			acceptBreak.setStartTime(breakCaBean.getStartTime());
			BreakBean offerBreak = new BreakBean();
			offerBreak.setAgentDayId(breakCaBean.getOfferDayId());
			offerBreak.setStartTime(breakCaBean.getOfferStartDate());
			
			if ((AcceptIsManagedBreaks /*&& AcceptIsPilotAgent*/) || (OfferIsManagedBreaks /*&& OfferIsPilotAgent*/)) {	// if either of agents has auto breaks then get both break data for switch
				BreakDataModel.populateBreak(acceptBreak);
				BreakDataModel.populateBreak(offerBreak);
				
				breakCaBean.setFirstName(acceptBreak.getFirstName());
				breakCaBean.setLastName(acceptBreak.getLastName());
			}
			
			if (AcceptIsManagedBreaks /*&& AcceptIsPilotAgent*/) {
				BreakInfo breakInfoDel = of.createSHFSPBreaksBreakInfo();
				breakInfoDel.setMode("D");
				breakInfoDel.setEmployeeId(breakCaBean.getEmpIdNumber());
				breakInfoDel.setAgentDayId(breakCaBean.getAgentDayId());
				breakInfoDel.setStartDatePlanned(BaseConvert.dateToString(acceptBreak.getStartTime(), "yyyyMMddHHmmss"));
				breakInfoDel.setDuration(acceptBreak.getDuration());
				breakInfoList.add(breakInfoDel);
				
				BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
				breakInfoIns.setMode("I");
				breakInfoIns.setEmployeeId(breakCaBean.getEmpIdNumber());
				breakInfoIns.setAgentDayId(breakCaBean.getAgentDayId());
				breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(offerBreak.getStartTime(), "yyyyMMddHHmmss"));
				breakInfoIns.setDuration(offerBreak.getDuration());
				breakInfoList.add(breakInfoIns);
			}
			
			if (OfferIsManagedBreaks /*&& OfferIsPilotAgent*/) {
				BreakInfo breakInfoDel = of.createSHFSPBreaksBreakInfo();
				breakInfoDel.setMode("D");
				breakInfoDel.setEmployeeId(breakCaBean.getOfferEmpIdNumber());
				breakInfoDel.setAgentDayId(breakCaBean.getOfferDayId());
				breakInfoDel.setStartDatePlanned(BaseConvert.dateToString(offerBreak.getStartTime(), "yyyyMMddHHmmss"));
				breakInfoDel.setDuration(offerBreak.getDuration());
				breakInfoList.add(breakInfoDel);
				
				BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
				breakInfoIns.setMode("I");
				breakInfoIns.setEmployeeId(breakCaBean.getOfferEmpIdNumber());
				breakInfoIns.setAgentDayId(breakCaBean.getOfferDayId());
				breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(acceptBreak.getStartTime(), "yyyyMMddHHmmss"));
				breakInfoIns.setDuration(acceptBreak.getDuration());
				breakInfoList.add(breakInfoIns);
			}
			
			if (breakObject.getBreakInfo().size() > 0) {
				
				// convert to xml string (initial)
				String xmlStringMsg = null;
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
				} catch (JAXBException e) {
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				// insert to transactions table and get transaction ID
				TransactionBean transBean = getTransBeanBase(SHFConstants.SHF_SP_PROCESS_ID_SWITCH_BREAK, SHFConstants.SHF_SP_SOURCE, SHFConstants.SHF_SP_DESTINATION, breakCaBean.getUserId(), xmlStringMsg);
				
				createMessageTransaction(transBean);
				
				breakObject.setTransactionId(String.valueOf(transBean.getId()));
				
				// convert to xml string (final)
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
					logger.info("xmlString : "+xmlStringMsg);
				} catch (JAXBException e) {
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				if (xmlStringMsg != null && transBean.getId() != 0) {
					try {
						logger.info("Attempting to send message to tibco queue ...");
						sendTibcoQueueMsg(SHFConstants.SHF_SP_ATTRIBUTE_VALUE, sCtx, xmlStringMsg);
					} catch (XPathExpressionException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (IllegalArgumentException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (NamingException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					} catch (JMSException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
					
					//check for reply: either no reply, reply with error or success. If no reply or no success then revert changes at shifter side.
					logger.info("Checking response for transactiod id : " + transBean.getId());
					Vector<Long> tmpVec = new Vector<Long>();
					tmpVec.add(transBean.getId());
					Vector<TransactionBean> response = null;
					boolean success = false;
					
					try {
						response = checkMessageResponse(tmpVec);
						if(response.size() > 0) {
							TransactionBean respBean = response.get(0);
							logger.info("Response message found in DB");
							if(respBean.getXmlResponse() != null && SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE == respBean.getStatus() && respBean.getStatusDescription() == null){
								success = true;
								logger.info("Message contains SUCCESS status !");
							}
						}
					} catch (Exception e) {
						logger.error(e.getMessage());
					}
					if ( ! success) {
						
						// Failed to update SoftPhone, revert changes
						logger.info("Sync with SoftPhone failed, attempting to revert changes ... ");
						
						try {
							logger.info("Attempting DB rollback ... ");
							db.rollback();
						} catch (DBException e) {
							logger.error("Error while rollback : " + e.getMessage());
							ActionErrors actionErrors = new ActionErrors();
							actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
							throw new ShfException(actionErrors);
						} finally {
							try {
								db.close();
							} catch (DBException e) {
								logger.error("Error while closing db connection: "+e.getMessage());
								ActionErrors actionErrors = new ActionErrors();
								actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
								throw new ShfException(actionErrors);
							}
						}
						logger.info("Changes reverted successfully !");
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.shfsp_sync_failed"));
						throw new ShfException(actionErrors);
						
					} else {
						logger.info("Sync with SoftPhone complete, all changes applied successfully");
					}
				}
			}
		}	// END IF isManagedBreaks
		
		try {
			writeMassageForBreak(breakCaBean, SHFConstants.ACCEPT_OFFER);
			Vector<BreakCandidateBean> messages = rejectAllBreakOffer(breakCaBean);
			writeMassageForBreakVector(messages, SHFConstants.REJECT_OFFER);
		} catch (Exception e) {
			logger.error("An error occured while switching breaks, switch breaks probably took place nonetheless : "+e.getMessage(), e);
		}
		
		try {
			db.commit();
		} catch (DBException e) {
			logger.error("Error while commit : " + e.getMessage(), e);
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing db connection: "+e.getMessage(), e);
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}

		
	}	// END Function
	
	public void writeMassageForBreakVector(Vector vec,int messageType) {
		if(vec!=null){
			BreakCandidateBean breakBean=null;
			for(int i=0;i<vec.size();i++){
				breakBean=(BreakCandidateBean)vec.get(i);
				try {
					writeMassageForBreak(breakBean,messageType);
				} catch (ShfException e) {
					logger.error("error while sending message of "+messageType+ " :"+e.getMessage());
				}
			}
		}
	}
	
	public void writeMassageForBreak(BreakCandidateBean breakBean, int messageType) throws ShfException{
		logger.debug("Starting writeMassageForBreak()");
		BreakCandidateBean breakCaBean = new BreakCandidateBean();
		BreakCandidateBean breakOfferBean = new BreakCandidateBean();
		ReplaceMassage repMessage = new ReplaceMassage();
		ReplaceMassageDao  repMessageDao = new ReplaceMassageDao();
		String messageBody = new String();
		
		if (breakBean.getAgentDayId()!=0 && breakBean.getStartTime()!=null) {
			breakCaBean = getBreakCandidateDetails(breakBean.getAgentDayId(), breakBean.getStartTime());	
			}
		
		if (breakBean.getOfferDayId()!=0 && breakBean.getOfferStartDate()!=null) {
			breakOfferBean = getBreakCandidateDetails(breakBean.getOfferDayId(), breakBean.getOfferStartDate());	
			}
		
		
		switch (messageType){
			case SHFConstants.ASK_FOR_REPLACE: 
					repMessage.setSubject("הצעה להחלפת הפסקה");
					messageBody = breakCaBean.getFirstName()+ " " + breakCaBean.getLastName();
					messageBody = messageBody + " מציע לך להתחלף איתך בהפסקה שלו המתחילה ב : ";
					messageBody = messageBody +  BaseConvert.dateToString(breakCaBean.getStartTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " ומסתיימת ב ";
					messageBody = messageBody +  BaseConvert.dateToString(breakCaBean.getEndTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " בהפסקה שלך המתחילה ב:";
					messageBody = messageBody +  BaseConvert.dateToString(breakOfferBean.getStartTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " ומסתיימת ב ";
					messageBody = messageBody +  BaseConvert.dateToString(breakOfferBean.getEndTime(), "dd/MM/yyyy HH:mm");
					break;
			
			case SHFConstants.CANCEL_OFFER:
					repMessage.setSubject("ביטול הצעה להחלפת הפסקה");
					messageBody = breakCaBean.getFirstName()+ " " + breakCaBean.getLastName();
					messageBody = messageBody + " מבטל את הצעתו להתחלף איתך בהפסקה שלו המתחילה ב : ";
					messageBody = messageBody +  BaseConvert.dateToString(breakCaBean.getStartTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " ומסתיימת ב ";
					messageBody = messageBody +  BaseConvert.dateToString(breakCaBean.getEndTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " בהפסקה שלך המתחילה ב:";
					messageBody = messageBody +  BaseConvert.dateToString(breakOfferBean.getStartTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " ומסתיימת ב ";
					messageBody = messageBody +  BaseConvert.dateToString(breakOfferBean.getEndTime(), "dd/MM/yyyy HH:mm");
					break;

			case SHFConstants.ACCEPT_OFFER:
					repMessage.setSubject("קבלת הצעה להחלפת הפסקה");
					messageBody = breakCaBean.getFirstName()+ " " + breakCaBean.getLastName();
					messageBody = messageBody + " קיבל את ההצעתך להתחלף איתו בהפסקה שלו המתחילה ב : ";
					messageBody = messageBody +  BaseConvert.dateToString(breakCaBean.getStartTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " ומסתיימת ב ";
					messageBody = messageBody +  BaseConvert.dateToString(breakCaBean.getEndTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " בהפסקה שלך המתחילה ב:";
					messageBody = messageBody +  BaseConvert.dateToString(breakOfferBean.getStartTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " ומסתיימת ב ";
					messageBody = messageBody +  BaseConvert.dateToString(breakOfferBean.getEndTime(), "dd/MM/yyyy HH:mm");
					break;
					
			case SHFConstants.REJECT_OFFER:
					repMessage.setSubject("דחית הצעה להחלפת הפסקה");
					messageBody = breakCaBean.getFirstName()+ " " + breakCaBean.getLastName();
					messageBody = messageBody + " דוחה את ההצעתך להתחלף איתו בהפסקה שלו המתחילה ב : ";
					messageBody = messageBody +  BaseConvert.dateToString(breakCaBean.getStartTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " ומסתיימת ב ";
					messageBody = messageBody +  BaseConvert.dateToString(breakCaBean.getEndTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " בהפסקה שלך המתחילה ב:";
					messageBody = messageBody +  BaseConvert.dateToString(breakOfferBean.getStartTime(), "dd/MM/yyyy HH:mm");
					messageBody = messageBody +  " ומסתיימת ב ";
					messageBody = messageBody +  BaseConvert.dateToString(breakOfferBean.getEndTime(), "dd/MM/yyyy HH:mm");
					break;
		}
			
		try{
			repMessage.setEmpId(Integer.parseInt(breakOfferBean.getEmployeeId()));
		}catch (Exception e) {
			if(breakOfferBean!=null){
				logger.error("Error breakOfferBean.getEmployeeId = "+breakOfferBean.getEmployeeId());
			}
			repMessage.setEmpId(0);
		}
		repMessage.setIsRead("0");
		repMessage.setOfferFullName(breakCaBean.getFirstName()+" "+breakCaBean.getLastName());
		repMessage.setText( messageBody ); 
		repMessageDao.insert(repMessage);	
			
			
	}

	/**
	 * @param shiftBreakForm
	 */
	public void updateShiftBreaks(ShiftBreakForm shiftBreakForm)throws ShfException {
		logger.debug("Starting updateShiftBreaks()");
		
		ShiftDataModel.checkIfSwitchBreakMade(shiftBreakForm.getAgentDayId());
		
		try {
			String date=BaseConvert.dateToString(shiftBreakForm.getDate(),"dd/MM/yyyy");
			String dateEnd=BaseConvert.dateToString(shiftBreakForm.getDateEnd(),"dd/MM/yyyy");
			Date shiftStart = BaseConvert.stringToDate(date+" "+shiftBreakForm.getOriginalShiftStart(),"dd/MM/yyyy HH:mm");
			Date shiftEnd = BaseConvert.stringToDate(dateEnd+" "+shiftBreakForm.getOriginalShiftEnd(),"dd/MM/yyyy HH:mm");
			
			checkShiftBreakForm(shiftBreakForm,shiftStart,shiftEnd,null,false);
					
		} catch (ConvertException e1) {
			logger.error("error in updateShiftBreaks() while converting string to date : "+e1.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		
		// Managed breaks 7.2016
		// if agent's breaks are managed then get their old breaks (for later SoftPhone update) and check new breaks to confirm to managed breaks rules
		boolean isManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(shiftBreakForm.getOrgUnitCode())).getValue());
//		boolean isPilotAgent = SHFConstants.managedBreaksEmpList.contains(shiftBreakForm.getEmpIdNumber());
		Vector<BreakBean> oldBreaksForManaged = null;
		if (isManagedBreaks /*&& isPilotAgent*/) {
			// Get old breaks
			oldBreaksForManaged = populateBreaksForShift(shiftBreakForm.getAgentDayId());
		}
		
		String sqlDelBreaks = "delete from shifter.shf_employee_exceptions t where t.state_type=? and t.agent_day_id=? and t.entry_time is null and t.exit_time is null "; // Viki-> allow edit breaks after they start Igal 8.2013
		StringBuffer sqlInsBreaks = new StringBuffer();
		sqlInsBreaks.append("INSERT INTO SHIFTER.SHF_EMPLOYEE_EXCEPTIONS t ");
		sqlInsBreaks.append("(t.AGENT_DAY_ID,t.DURATION,t.START_TIME,t.END_TIME,t.SOURCE,t.STATE_TYPE,t.EXCEPTION_TYPE, t.MODIFICATION_TIME, t.MODIFICATION_USER) ");
		sqlInsBreaks.append("values(?,?,?,?+?/1440,'SHF',?,0,?,?)");
		long agentDayId=shiftBreakForm.getAgentDayId();
		String date=BaseConvert.dateToString(shiftBreakForm.getDate(),"dd/MM/yyyy");

		DBAccess db = null;
		try {
			db = new DBAccess(false);
			
			// del old breaks
			db.prepareStatement(sqlDelBreaks);
			db.setInt(1,SHFConstants.STATE_BREAK);
			db.setLong(2,agentDayId);
			try{
				db.executeUpdate();
			}catch(DBUpdateNoRowsException e){} 
			
			// change source
			ShiftDataModel.changeShiftSource(db,agentDayId,"SHF","WFM");
			
			// add new breaks			
			int param = 1;
//			Date now = new Date();
			if(shiftBreakForm.getBreaksNumber()>0 && shiftBreakForm.getFirstBreakEnded()!=1){
				db.prepareStatement(sqlInsBreaks.toString());
				db.setLong(param++,agentDayId);
				int length1=shiftBreakForm.getFirstBreakLength();
				Date firstStart=BaseConvert.stringToDate(date+" "+shiftBreakForm.getFirstBreakTime(),"dd/MM/yyyy HH:mm");
				db.setInt(param++,length1);
				db.setTimestamp(param++,firstStart);
				db.setTimestamp(param++,firstStart);
				db.setInt(param++,length1);
				db.setInt(param++,SHFConstants.STATE_BREAK);
				db.setTimestamp(param++, shiftBreakForm.getModificationTime());
				db.setString(param++, shiftBreakForm.getModificationUser());
				try {
					db.executeUpdate();
				} catch (DBDuplicateKeyException e2) {
					
				}
				
			}
			param = 1;
			if(shiftBreakForm.getBreaksNumber()>1 && shiftBreakForm.getSecondBreakEnded()!=1){
				db.prepareStatement(sqlInsBreaks.toString());
				int length2=shiftBreakForm.getSecondBreakLength();
				Date secondStart=BaseConvert.stringToDate(date+" "+shiftBreakForm.getSecondBreakTime(),"dd/MM/yyyy HH:mm");
				db.setLong(param++,agentDayId);
				db.setInt(param++,length2);
				db.setTimestamp(param++,secondStart);
				db.setTimestamp(param++,secondStart);
				db.setInt(param++,length2);
				db.setInt(param++,SHFConstants.STATE_BREAK);
				db.setTimestamp(param++, shiftBreakForm.getModificationTime());
				db.setString(param++, shiftBreakForm.getModificationUser());
				try {
					db.executeUpdate();
				} catch (DBDuplicateKeyException e2) {
					
				}
			}
			param = 1;
			if(shiftBreakForm.getBreaksNumber()>2 && shiftBreakForm.getThirdBreakEnded()!=1){
				db.prepareStatement(sqlInsBreaks.toString());
				int length3=shiftBreakForm.getThirdBreakLength();
				Date thirdStart=BaseConvert.stringToDate(date+" "+shiftBreakForm.getThirdBreakTime(),"dd/MM/yyyy HH:mm");
				db.setLong(param++,agentDayId);
				db.setInt(param++,length3);
				db.setTimestamp(param++,thirdStart);
				db.setTimestamp(param++,thirdStart);
				db.setInt(param++,length3);
				db.setInt(param++,SHFConstants.STATE_BREAK);
				db.setTimestamp(param++, shiftBreakForm.getModificationTime());
				db.setString(param++, shiftBreakForm.getModificationUser());
				try {
					db.executeUpdate();
				} catch (DBDuplicateKeyException e2) {
					
				}	
			}
			
//			db.commit();	// Disabled for managed breaks
			
		} catch(ConvertException e){
			logger.error("error in updateShiftBreaks() while converting string to date : "+e.getMessage());
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error in updateShiftBreaks() while rollback after ConvertException : "+e1.getMessage());
			}
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
			
		} catch(DBException e) {
			logger.error("error in updateShiftBreaks() : "+e.getMessage());
			try {
				db.rollback();
			} catch (DBException e1) {
				logger.error("error in updateShiftBreaks() while rollback after DBException : "+e1.getMessage());
			}
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
//			try {
//				db.close();		// Disabled for managed breaks
//			} catch (DBException e) {
//				logger.error("error in updateShiftBreaks() while closing  connenction : "+e.getMessage());
//				ActionErrors actionErrors=new ActionErrors();
//				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
//				throw new ShfException(actionErrors);
//			}
		}
		
		// check new breaks and update breaks at SoftPhone side via tibco ems
		if (isManagedBreaks /*&& isPilotAgent*/) {
			SHFSPBreaks breakObject = updateShiftBreaksManaged(shiftBreakForm, oldBreaksForManaged);
			breakObject.setUserId(shiftBreakForm.getUserId());
			
			if (breakObject.getBreakInfo().size() > 0) {	// changes exist -> send message to SoftPhone
				// 1st convert to xml string
				String xmlStringMsg = null;
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
				} catch (JAXBException e) {
					e.printStackTrace();
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				// 2nd insert to transactions table and get transaction ID
				TransactionBean transBean = getTransBeanBase(SHFConstants.SHF_SP_PROCESS_ID_BREAK_UPDATE, SHFConstants.SHF_SP_SOURCE, SHFConstants.SHF_SP_DESTINATION, shiftBreakForm.getUserId(), xmlStringMsg);

				createMessageTransaction(transBean);
				
				breakObject.setTransactionId(String.valueOf(transBean.getId()));
				
				try {
					xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
					logger.info("xmlString : "+xmlStringMsg);
				} catch (JAXBException e) {
					e.printStackTrace();
					logger.error("Error while creating XML string for sending message : " + e.getMessage());
				}
				
				// 3rd send message
				if (xmlStringMsg != null && transBean.getId() != 0) {
					
					try {
						logger.info("Attempting to send message to tibco queue ...");
						sendTibcoQueueMsg(SHFConstants.SHF_SP_ATTRIBUTE_VALUE, sCtx, xmlStringMsg);
					} catch (XPathExpressionException e) {
						e.printStackTrace();
					} catch (IllegalArgumentException e) {
						e.printStackTrace();
					} catch (NamingException e) {
						e.printStackTrace();
					} catch (JMSException e) {
						e.printStackTrace();
					}
						
					// 4th check for reply: either no reply, reply with error or success. If no reply or no success then revert changes at shifter side.
					// sleep for sometime and wait for message to arrive, attempt few times
					logger.info("Checking response for transactiod id : " + transBean.getId());
					
					Vector<Long> tmpVec = new Vector<Long>();
					tmpVec.add(transBean.getId());
					Vector<TransactionBean> response = null;
					boolean success = false;
						
					try {
						response = checkMessageResponse(tmpVec);
						
						if(response.size() > 0) {
							TransactionBean respBean = response.get(0);
							if(respBean.getXmlResponse() != null && SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE == respBean.getStatus() && respBean.getStatusDescription() == null){
								success = true;
							}
						}
						
					} catch (Exception e) {
						
					}
					
					if ( ! success) {
						logger.info("Sync with SoftPhone failed, attempting to revert changes ... ");
						
						try {
							logger.info("Attempting DB rollback ... ");
							db.rollback();
						} catch (DBException e) {
							logger.error("Error while rollback : " + e.getMessage());
							ActionErrors actionErrors = new ActionErrors();
							actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
							throw new ShfException(actionErrors);
						} finally {
							try {
								db.close();
							} catch (DBException e) {
								logger.error("error while closing db connection: "+e.getMessage());
								ActionErrors actionErrors = new ActionErrors();
								actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
								throw new ShfException(actionErrors);
							}
						}
						logger.info("Changes reverted successfully !");
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.shfsp_sync_failed"));
						throw new ShfException(actionErrors);
						
					} else {
						
						logger.info("Sync with SoftPhone complete, all changes applied successfully");
					}
					
				}	// END IF (xmlStringMsg != null && transBean.getId() != 0)
				
			}	// END IF (breakObject.getBreakInfo().size() > 0)

		}	// END IF isManagedBreaks
		
		try {
			db.commit();
		} catch (DBException e) {
			logger.error("Error while commit : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("error while closing db connection: "+e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
	}	// END METHOD
	
	
	public bzq.shfsp.request.SHFSPBreaks updateShiftBreaksManaged(ShiftBreakForm shiftBreakForm, Vector<BreakBean> oldBreaksForManaged) throws ShfException {

		bzq.shfsp.request.ObjectFactory of = new bzq.shfsp.request.ObjectFactory();
		bzq.shfsp.request.SHFSPBreaks breakObject = of.createSHFSPBreaks();
		List<BreakInfo> breakInfoList = breakObject.getBreakInfo();
		
		int managedBreaksMin = Integer.parseInt(bzq.shf.utils.SHFParameters.getManagedBreakMinTimeBeforeChange(bzq.shf.utils.SHFTableUtils.getAgafCodeOf(shiftBreakForm.getOrgUnitCode())).getValue());
		logger.info("Agent Day id : " + shiftBreakForm.getAgentDayId());
		
		// ----- 1st break
		if(shiftBreakForm.getBreaksNumber() > 0 && shiftBreakForm.getFirstBreakTimeOld() != null ) {	// update break	(check new date)
			if ( ! shiftBreakForm.getFirstBreakTime().equals(shiftBreakForm.getFirstBreakTimeOld()) || ! (shiftBreakForm.getFirstBreakLength() == shiftBreakForm.getFirstBreakLengthOld())) {	// if changes made
				logger.info("Managed breaks, update 1st break");
				
				// check new times with managed breaks rules
				BreakBean breakBean = new BreakBean();
				breakBean.setStartTime(shiftBreakForm.getFirstBreakStartDateTime());
				updateShiftBreaksCheckManaged(breakBean ,managedBreaksMin);
				
				// check done, prepare message (Delete old, Insert new)
				BreakInfo breakInfoDel = of.createSHFSPBreaksBreakInfo();
				breakInfoDel.setMode("D");
				breakInfoDel.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
				breakInfoDel.setAgentDayId(shiftBreakForm.getAgentDayId());
				breakInfoDel.setStartDatePlanned(BaseConvert.dateToString(shiftBreakForm.getFirstBreakStartDateTime(), "yyyyMMddHHmmss"));
				breakInfoDel.setDuration(shiftBreakForm.getFirstBreakLengthOld());
				
				BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
				breakInfoIns.setMode("I");
				breakInfoIns.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
				breakInfoIns.setAgentDayId(shiftBreakForm.getAgentDayId());
				Date newStart = null;
				try {
					newStart = BaseConvert.stringToDate(BaseConvert.dateToString(shiftBreakForm.getFirstBreakStartDateTime(), "dd/MM/yyyy") + " " + shiftBreakForm.getFirstBreakTime(), "dd/MM/yyyy HH:mm");
				} catch (ConvertException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
					throw new ShfException("Error while coverting date");
				}
				breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(newStart, "yyyyMMddHHmmss"));
				breakInfoIns.setDuration(shiftBreakForm.getFirstBreakLength());
				
				breakInfoList.add(breakInfoDel);
				breakInfoList.add(breakInfoIns);
			}
		} else if(shiftBreakForm.getBreaksNumber() > 0 && shiftBreakForm.getFirstBreakTimeOld() == null ) {	// insert new break	(check new)
			logger.info("Managed breaks, insert 1st new break");
			
			// check new times with managed breaks rules
			BreakBean breakBean = new BreakBean();
			Date newStart = null;
			try {
				newStart = BaseConvert.stringToDate(BaseConvert.dateToString(shiftBreakForm.getDate(), "dd/MM/yyyy") + " " + shiftBreakForm.getFirstBreakTime(), "dd/MM/yyyy HH:mm");
			} catch (ConvertException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				throw new ShfException("Error while converting date");
			}
			breakBean.setStartTime(newStart);
			updateShiftBreaksCheckManaged(breakBean ,managedBreaksMin);
			
			BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
			breakInfoIns.setMode("I");
			breakInfoIns.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
			breakInfoIns.setAgentDayId(shiftBreakForm.getAgentDayId());

			breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(newStart, "yyyyMMddHHmmss"));
			breakInfoIns.setDuration(shiftBreakForm.getFirstBreakLength());
			
			breakInfoList.add(breakInfoIns);
			
		} else if (shiftBreakForm.getBreaksNumber() == 0 && shiftBreakForm.getFirstBreakTimeOld() != null) {	// delete break
			System.out.println("Managed breaks, delete 1st break");
			
			BreakInfo breakInfoDel = of.createSHFSPBreaksBreakInfo();
			breakInfoDel.setMode("D");
			breakInfoDel.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
			breakInfoDel.setAgentDayId(shiftBreakForm.getAgentDayId());
			breakInfoDel.setStartDatePlanned(BaseConvert.dateToString(shiftBreakForm.getFirstBreakStartDateTime(), "yyyyMMddHHmmss"));
			breakInfoDel.setDuration(shiftBreakForm.getFirstBreakLengthOld());
			
			breakInfoList.add(breakInfoDel);
		}
		
		// ----- 2nd
		
		if(shiftBreakForm.getBreaksNumber() > 1 && shiftBreakForm.getSecondBreakTimeOld() != null ) {	// update break	(check new date and old date)
			if ( ! shiftBreakForm.getSecondBreakTime().equals(shiftBreakForm.getSecondBreakTimeOld()) || ! (shiftBreakForm.getSecondBreakLength() == shiftBreakForm.getSecondBreakLengthOld())) {	// if changes made
				logger.info("Managed breaks, update 2nd break");
				
				// check new times with managed breaks rules
				BreakBean breakBean = new BreakBean();
				breakBean.setStartTime(shiftBreakForm.getSecondBreakStartDateTime());
				updateShiftBreaksCheckManaged(breakBean ,managedBreaksMin);
				
				// check done, prepare message (Delete old, Insert new)
				BreakInfo breakInfoDel = of.createSHFSPBreaksBreakInfo();
				breakInfoDel.setMode("D");
				breakInfoDel.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
				breakInfoDel.setAgentDayId(shiftBreakForm.getAgentDayId());
				breakInfoDel.setStartDatePlanned(BaseConvert.dateToString(shiftBreakForm.getSecondBreakStartDateTime(), "yyyyMMddHHmmss"));
				breakInfoDel.setDuration(shiftBreakForm.getSecondBreakLengthOld());
				
				BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
				breakInfoIns.setMode("I");
				breakInfoIns.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
				breakInfoIns.setAgentDayId(shiftBreakForm.getAgentDayId());
				Date newStart = null;
				try {
					newStart = BaseConvert.stringToDate(BaseConvert.dateToString(shiftBreakForm.getSecondBreakStartDateTime(), "dd/MM/yyyy") + " " + shiftBreakForm.getSecondBreakTime(), "dd/MM/yyyy HH:mm");
				} catch (ConvertException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
					throw new ShfException("Error while coverting date");
				}
				breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(newStart, "yyyyMMddHHmmss"));
				breakInfoIns.setDuration(shiftBreakForm.getSecondBreakLength());
				
				breakInfoList.add(breakInfoDel);
				breakInfoList.add(breakInfoIns);
			}
		} else if(shiftBreakForm.getBreaksNumber() > 1 && shiftBreakForm.getSecondBreakTimeOld() == null ) {	// insert new break	(check new)
			logger.info("Managed breaks, insert 2nd new break");
			
			// check new times with managed breaks rules
			BreakBean breakBean = new BreakBean();
			Date startTime = null;
			try {
				startTime = BaseConvert.stringToDate(BaseConvert.dateToString(shiftBreakForm.getDate(), "dd/MM/yyyy") + " " + shiftBreakForm.getSecondBreakTime(), "dd/MM/yyyy HH:mm");
			} catch (ConvertException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				throw new ShfException("Error while coverting date");
			}
			breakBean.setStartTime(startTime);
			updateShiftBreaksCheckManaged(breakBean ,managedBreaksMin);
			
			BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
			breakInfoIns.setMode("I");
			breakInfoIns.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
			breakInfoIns.setAgentDayId(shiftBreakForm.getAgentDayId());

			breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(startTime, "yyyyMMddHHmmss"));
			breakInfoIns.setDuration(shiftBreakForm.getSecondBreakLength());
			
			breakInfoList.add(breakInfoIns);
			
		} else if (shiftBreakForm.getBreaksNumber() < 2 && shiftBreakForm.getSecondBreakTimeOld() != null) {	// delete break
			logger.info("Managed breaks, delete 2nd break");
			
			BreakInfo breakInfoDel = of.createSHFSPBreaksBreakInfo();
			breakInfoDel.setMode("D");
			breakInfoDel.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
			breakInfoDel.setAgentDayId(shiftBreakForm.getAgentDayId());
			breakInfoDel.setStartDatePlanned(BaseConvert.dateToString(shiftBreakForm.getSecondBreakStartDateTime(), "yyyyMMddHHmmss"));
			breakInfoDel.setDuration(shiftBreakForm.getSecondBreakLengthOld());
			
			breakInfoList.add(breakInfoDel);
		}
		
		//----- 3rd
		
		if(shiftBreakForm.getBreaksNumber() > 2 && shiftBreakForm.getThirdBreakTimeOld() != null ) {	// update break	(check new date)
			if ( ! shiftBreakForm.getThirdBreakTime().equals(shiftBreakForm.getThirdBreakTimeOld()) || ! (shiftBreakForm.getThirdBreakLength() == shiftBreakForm.getThirdBreakLengthOld())) {	// if changes made
				logger.info("Managed breaks, update 3rd break");
				
				// check new times with managed breaks rules
				BreakBean breakBean = new BreakBean();
				breakBean.setStartTime(shiftBreakForm.getThirdBreakStartDateTime());
				updateShiftBreaksCheckManaged(breakBean, managedBreaksMin);
				
				// check done, prepare message (Delete old, Insert new)
				BreakInfo breakInfoDel = of.createSHFSPBreaksBreakInfo();
				breakInfoDel.setMode("D");
				breakInfoDel.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
				breakInfoDel.setAgentDayId(shiftBreakForm.getAgentDayId());
				breakInfoDel.setStartDatePlanned(BaseConvert.dateToString(shiftBreakForm.getThirdBreakStartDateTime(), "yyyyMMddHHmmss"));
				breakInfoDel.setDuration(shiftBreakForm.getThirdBreakLengthOld());
				
				BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
				breakInfoIns.setMode("I");
				breakInfoIns.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
				breakInfoIns.setAgentDayId(shiftBreakForm.getAgentDayId());
				Date newStart = null;
				try {
					newStart = BaseConvert.stringToDate(BaseConvert.dateToString(shiftBreakForm.getThirdBreakStartDateTime(), "dd/MM/yyyy") + " " + shiftBreakForm.getThirdBreakTime(), "dd/MM/yyyy HH:mm");
				} catch (ConvertException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
					throw new ShfException("Error while converting date");
				}
				breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(newStart, "yyyyMMddHHmmss"));
				breakInfoIns.setDuration(shiftBreakForm.getThirdBreakLength());
				
				breakInfoList.add(breakInfoDel);
				breakInfoList.add(breakInfoIns);
			}
		} else if(shiftBreakForm.getBreaksNumber() > 2 && shiftBreakForm.getThirdBreakTimeOld() == null ) {	// insert new break	(check new)
			logger.info("Managed breaks, insert 3rd new break");
			
			Date newStart = null;
			try {
				newStart = BaseConvert.stringToDate(BaseConvert.dateToString(shiftBreakForm.getDate(), "dd/MM/yyyy") + " " + shiftBreakForm.getThirdBreakTime(), "dd/MM/yyyy HH:mm");
			} catch (ConvertException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				throw new ShfException("Error while converting date");
			}
			
			// check new break times with managed breaks rules
			BreakBean breakBean = new BreakBean();
			breakBean.setStartTime(newStart);
			updateShiftBreaksCheckManaged(breakBean ,managedBreaksMin);
			
			BreakInfo breakInfoIns = of.createSHFSPBreaksBreakInfo();
			breakInfoIns.setMode("I");
			breakInfoIns.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
			breakInfoIns.setAgentDayId(shiftBreakForm.getAgentDayId());

			breakInfoIns.setStartDatePlanned(BaseConvert.dateToString(newStart, "yyyyMMddHHmmss"));
			breakInfoIns.setDuration(shiftBreakForm.getThirdBreakLength());
			
			breakInfoList.add(breakInfoIns);
			
		} else if (shiftBreakForm.getBreaksNumber() < 3 && shiftBreakForm.getThirdBreakTimeOld() != null) {	// delete break (check old)
			logger.info("Managed breaks, delete 3rd break");
			
			BreakInfo breakInfoDel = of.createSHFSPBreaksBreakInfo();
			breakInfoDel.setMode("D");
			breakInfoDel.setEmployeeId(String.valueOf(shiftBreakForm.getEmployeeIdNumberFull()));
			breakInfoDel.setAgentDayId(shiftBreakForm.getAgentDayId());
			breakInfoDel.setStartDatePlanned(BaseConvert.dateToString(shiftBreakForm.getThirdBreakStartDateTime(), "yyyyMMddHHmmss"));
			breakInfoDel.setDuration(shiftBreakForm.getThirdBreakLengthOld());
			
			breakInfoList.add(breakInfoDel);

		}
		if (breakInfoList.size() > 0) {
			breakObject.setActionId(SHFConstants.SHF_SP_ACTION_ID_BREAK_UPDATE);
			SHFUtils.setSHFSPMessageDefaults(breakObject);
		}
		
		return breakObject;

	}
	
	public void updateShiftBreaksCheckManaged(BreakBean breakBean, long managedBreaksMin) throws ShfException {
		Date now = new Date();
		long managedBreaksMinMillis = managedBreaksMin * 60 * 1000;
		
		if ( breakBean.getStartTime().getTime() - now.getTime() <=  managedBreaksMinMillis) {
			logger.error("1st break violating min time to update managed break");
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateManagedBreakMinTimeBeforeChange", String.valueOf(managedBreaksMin)));
			throw new ShfException(actionErrors);
		}
		
	}
	
	/**
	 * Method to create initial TransactionBean
	 * 
	 * @param processid
	 * @param source
	 * @param destination
	 * @param EmpIdNum
	 * @param XmlRequest
	 * @return
	 */
	public TransactionBean getTransBeanBase (int processid, String source, String destination, String EmpIdNum, String XmlRequest) {
		
		TransactionBean transBean = new TransactionBean();
		transBean.setProcessId(processid);
		transBean.setSource(source);
		transBean.setDestination(destination);
		transBean.setEmployeeId(EmpIdNum);
		transBean.setXmlRequest(XmlRequest);
		
		return transBean;
	}
	
	/**
	 * Method to send queue message via Tibco JMS 
	 * 
	 * @param qName
	 * @param sCtx
	 * @param xmlStringMsg
	 * @throws XPathExpressionException
	 * @throws IllegalArgumentException
	 * @throws NamingException
	 * @throws JMSException
	 */
	public void sendTibcoQueueMsg (String qName, ServletContext sCtx, String xmlStringMsg) 
			throws XPathExpressionException, IllegalArgumentException, NamingException, JMSException {
		
		Document addConfigDoc = (Document)sCtx.getAttribute("addConfigDoc");
		String queueName = null;
		
		queueName = SHFUtils.retrieveAttributeValue(addConfigDoc, "/app-config/jms/shf-sp/request/tibco-info/@queueJndiName");
		
		TibcoQueueMessageSender tqms = null;
		if (queueName != null && queueName.length() > 0) {
			
			tqms = new TibcoQueueMessageSender(queueName);
			tqms.send(xmlStringMsg, true);	// send message and close connection
			
		}
	}
	
	/**
	 * 
	 * @return Vector<TransactionBean> Vector of type TransactionBean, containing successful responses
	 * 
	 * @param Vector<Long>
	 * @throws IllegalArgumentException 
	 * @throws ShfException 
	 */
	public Vector<TransactionBean> checkMessageResponse (Vector<Long> transId) throws ShfException, IllegalArgumentException {
		logger.debug("Starting checkMessageResponse()");
		
		if (transId == null || transId.size() == 0) {
			
			logger.error("Required param 'transId' is invalid (NULL or EMPTY)");
			throw new IllegalArgumentException("Required param 'transId' is invalid (NULL or EMPTY)");
			
		}
		
		// check for reply: either no reply, reply with error or success.
		
		Vector<TransactionBean> successRespTotal = new Vector<TransactionBean>();	// received replies - with success status
		int respTotal = 0;	// counter total received replies
		
		// sleep for sometime and wait for message to arrive, attempt few times
		for (int i = 0; i < SHFConstants.SHF_SP_RESPONSE_CHECK_ATTEMPTS; i++) {
			
			logger.info("Sending servlet thread to sleep for "+SHFConstants.SHF_SP_RESPONSE_CHECK_INTERVAL/1000+" sec, attempt no."+(i+1)+" ...");
			try {
				Thread.sleep(SHFConstants.SHF_SP_RESPONSE_CHECK_INTERVAL);
				logger.info("Thread woke up from sleep and running ...");
			} catch (InterruptedException e) {
				logger.error("Error while sending thread to sleep : " + e.getMessage(), e);
			}
			Vector<TransactionBean> resp = null;
			resp = filterInvalidResponses(populateTransByIdVec(transId));
		
			if (resp != null && resp.size() > 0) {
				for (TransactionBean respBean : resp) {
					boolean found = false;
					
					for (TransactionBean totalBean  : successRespTotal) {
						if (respBean.getId() == totalBean.getId()) {
							found = true;
						}
					}
					
					if ( ! found ) {
						respTotal++;
						if (SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE == respBean.getStatus() && respBean.getXmlResponse() != null) {
							successRespTotal.add(respBean);
						}
					}
				}
		
				if (respTotal == transId.size()) {
					break;
				}
			}
			
		}	// end FOR
		
		return successRespTotal;
		
	}
	
	/**
	 * Method to filter invalid responses, ie if response only have status 0, without either 'xml_response' or 'status_description'.
	 * If respVec is null or empty same is returned, ie resultVec is null or empty
	 * 
	 * @param respVec Vector<TransactionBean>
	 * @return resultVec Vector<TransactionBean>
	 * 
	 * 
	 */
	
	public Vector<TransactionBean> filterInvalidResponses (Vector<TransactionBean> respVec) {
		logger.debug("Starting filterInvalidResponses()");
		
		Vector<TransactionBean> resultVec = null;
		
		if (respVec == null || respVec.size() == 0) {
			logger.error("Null or empty argument");
			return respVec;
		}
		
		resultVec = new Vector<TransactionBean>();
		
		for (TransactionBean transactionBean : respVec) {
			if (transactionBean.getXmlResponse() != null || transactionBean.getStatusDescription() != null) {
				resultVec.add(transactionBean);
			}
		}
		
		return resultVec;
		
	}	// END Method
	
	/**
	 * Method to check if OLD break coming from user is a real break (exists in DB)
	 * @param breakTimeOld
	 * @param breakLengthOld
	 * @param oldBreaksForManaged All breaks for shift from DB
	 * @return
	 */
	public boolean updateManagedBreakIsOld(String breakTimeOld, int breakLengthOld, Vector<BreakBean> oldBreaksForManaged) {
		boolean result = false;
		
		for (BreakBean oldBreakBean : oldBreaksForManaged) {
			if (breakTimeOld.equals(SHFUtils.formatDateToString(oldBreakBean.getStartTime(), "HH:mm")) && breakLengthOld == oldBreakBean.getDuration()) {
				result = true;
				break;
			}
		}
		
		return result;
		
	}
	
	public void updateShiftBreaksManagedSendMessage(ShiftBreakForm shiftBreakForm, Vector<BreakBean> oldBreaksForManaged) throws ShfException {
		
	}
	
	public static void checkValidBreakRangeWithShift(Date shiftStart, Date shiftEnd, Date breakStart, long breakDuration,Integer timeFromShift,boolean source) throws ShfException {
		logger.debug("Starting checkValidBreakRangeWithShift()");
		if(breakDuration<=0 && source ){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.breakLength"));
			throw new ShfException(actionErrors);
		}
		
		//System.out.println((breakStart.getTime() - shiftStart.getTime()) /60000);
		if ( (breakStart.getTime() - shiftStart.getTime()) / 60000 < timeFromShift ) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.breakTimeShift"));
			throw new ShfException(actionErrors);
		}
		
		//System.out.println((shiftEnd.getTime() - (breakStart.getTime()+ (breakDuration*60000))) /60000);
		if (breakDuration!=0){
			if ( (shiftEnd.getTime() - (breakStart.getTime()+ (breakDuration*60000))) / 60000 < timeFromShift ) {
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.breakTimeShift"));
				throw new ShfException(actionErrors);
			}		
		}
		
	}
	
	public static void checkBreakRange(Date firstBreakStart,int firstBreakLength,Date secondBreakStart,int secondBreakLength,int allowedRange) throws ShfException {
		logger.debug("Starting checkBreakRange()");
		int range=0;
		if(firstBreakStart.before(secondBreakStart)){
			range=Math.abs((int)(firstBreakStart.getTime()-secondBreakStart.getTime())/60000);
			range-=firstBreakLength;
		}else{
			range=Math.abs((int)(secondBreakStart.getTime()-firstBreakStart.getTime())/60000);
			range-=secondBreakLength;
		}
		if(range<allowedRange){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.rangeBetweenBreaks", String.valueOf(allowedRange)));
			throw new ShfException(actionErrors);
		}
	
	}
		
	public static void checkShiftBreakForm(ShiftBreakForm form,Date shiftStart, Date shiftEnd,Integer timeFromShift,boolean source) throws ShfException{
		logger.debug("Starting checkShiftBreakForm()");
		
		Date break1=null;
		Date break2=null;
		Date break3=null;
		if (timeFromShift == null){
			timeFromShift= 60;
		}
		int num=form.getBreaksNumber();
		try{
			if(num>0){ 
				break1=BaseConvert.stringToDate(BaseConvert.dateToString(shiftStart,"dd/MM/yyyy")+" "+form.getFirstBreakTime(),"dd/MM/yyyy HH:mm"); 
				checkValidBreakRangeWithShift(shiftStart,shiftEnd,break1,form.getFirstBreakLength(),timeFromShift,source);
			}
			if(num>1){ 
				break2=BaseConvert.stringToDate(BaseConvert.dateToString(shiftStart,"dd/MM/yyyy")+" "+form.getSecondBreakTime(),"dd/MM/yyyy HH:mm"); 
				checkValidBreakRangeWithShift(shiftStart,shiftEnd,break2,form.getSecondBreakLength(),timeFromShift,source);
			}
			if(num>2){ 
				break3=BaseConvert.stringToDate(BaseConvert.dateToString(shiftStart,"dd/MM/yyyy")+" "+form.getThirdBreakTime(),"dd/MM/yyyy HH:mm"); 
				checkValidBreakRangeWithShift(shiftStart,shiftEnd,break3,form.getThirdBreakLength(),timeFromShift,source);
			}
		}catch(ConvertException e){
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}
		
		int allowedRange=SHFConstants.MIN_RANGE_BETWEEN_BREAKS;
		
		if(num>1 && !source){ 
			checkBreakRange(break1,form.getFirstBreakLength(),break2,form.getSecondBreakLength(),allowedRange);
		}
		if(num>2 && !source){
			checkBreakRange(break1,form.getFirstBreakLength(),break3,form.getThirdBreakLength(),allowedRange);
			checkBreakRange(break2,form.getSecondBreakLength(),break3,form.getThirdBreakLength(),allowedRange);
		}
		
		
	}
	
	public TransactionBean createMessageTransaction(TransactionBean transBean) throws ShfException {
		logger.debug("Starting createMessageTransaction()");
		
		int param = 1;
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT SHIFTER.SHF_ins_and_return_lastId ");
		sql.append("(?, ?, ?, ?, ?, ?) AS ID ");
		sql.append("FROM dual ");
		
		DBAccess db = null;
		
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			
			db.setInt(param++,	transBean.getProcessId());
			db.setString(param++,	transBean.getSource());
			db.setString(param++,	transBean.getDestination());
			db.setTimestamp(param++, new Date());
			db.setString(param++,	transBean.getEmployeeId());
			db.setString(param++,	transBean.getXmlRequest());
			
			db.executeQuery();
			db.populate(transBean);
			
		}catch(DBUpdateNoRowsException e) { 

		} catch (DBException e) {
			logger.error("DB error  : " +e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing db connection : " +e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
				throw new ShfException(actionErrors);
			}
		}

		return transBean;

	}
	
	public void updateTransaction (SHFSPBreaksResponse response, String msg) {
		logger.debug("Starting updateTransaction()");
		
		int param = 1;
		StringBuffer sql = new StringBuffer();
		sql.append("UPDATE shifter.shf_transactions t ");
		sql.append("SET t.UPDATE_DATE = ?, t.XML_RESPONSE = ?, t.STATUS = ? ");	// 1, 2, 3,
		if (response.getStatusCode() != null && ! response.getStatusCode().equals(String.valueOf(SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE))) {
			sql.append(" ,t.STATUS_DESCRIPTION = ? ");	// 4
		}
		sql.append("WHERE t.ID = ? ");	// 5
		
		DBAccess db = new DBAccess();
		
		try {
			db.prepareStatement(sql.toString());
			db.setTimestamp(param++, new Date());	// 1
			db.setString(param++, msg);				// 2
			db.setInt(param++, Integer.parseInt(response.getStatusCode()));	// 3
			if (response.getStatusCode() != null && ! response.getStatusCode().equals(String.valueOf(SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE))) {
				db.setString(param++, response.getStatusDesc());	// 4
			}
			db.setInt(param++, Integer.parseInt(response.getTransactionId()));	// 5
			
			db.executeUpdate();
			
		}catch(DBUpdateNoRowsException e){
			 logger.error("Error, no matching record found while updating TRANSACTIONS table : " + e.getMessage());
			
		}catch (DBException e) {
			logger.error("DB error while updating TRANSACTIONS table : " + e.getMessage());
		} finally {
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing DB connection : " + e.getMessage());
			}
		}
	}
	
	public Vector<TransactionBean> populateTransByIdVec (Vector<Long> transId) throws ShfException, IllegalArgumentException {
		if (transId == null || transId.size() == 0) {
			logger.error("Parameter is null or size zero");
			throw new IllegalArgumentException();
		}
		Vector<TransactionBean> resultBean = null;
		
		int param = 1;
		StringBuffer sql = new StringBuffer();
		sql.append("SELECT * FROM SHIFTER.SHF_TRANSACTIONS t ");
		sql.append("WHERE t.ID IN ( ");
			for (int i = 0; i < transId.size(); i++) {
				sql.append("?");
				if(i < transId.size()-1) {
					sql.append(",");
				}
			}
		sql.append(") ");
		
		DBAccess db = new DBAccess();
		try {
			db.prepareStatement(sql.toString());
			
			for (int i = 0; i < transId.size(); i++) {
				db.setLong(param++,	transId.get(i));
			}
			
			db.executeQuery();
			resultBean = new Vector<TransactionBean>();
			db.populate("bzq.shf.bean.TransactionBean", resultBean);
			
		} catch(DBQueryNoRowsException e){
			
		} catch (DBException e) {
			logger.error("DB error while populating : " +e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("Error while closing connection : " +e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
		return resultBean;
	}
	
	public void deleteAllBreaksFromCandidate(long agentDayId) throws ShfException{
		logger.debug("Starting deleteBreakCandidate()");

		String sql2="DELETE FROM SHIFTER.SHF_REPLACE_BREAK_CANDIDATES " +
					"WHERE SHF_EMPLOYEE_DAY_ID = ? ";
		
		String sql1="UPDATE SHIFTER.SHF_REPLACE_BREAK_CANDIDATES t " +
					"SET t.STATUS='OPEN',t.OFFER_DAY_ID=null,t.OFFER_START_DATE=null,t.MODIFIED_DATE=? WHERE OFFER_DAY_ID = ? ";
		DBAccess db=null;					
		try {
			db=new DBAccess();
			db.prepareStatement(sql1);
			db.setTimestamp(1,new Date());
			db.setLong(2,agentDayId);
			try{
				db.executeUpdate();
			}catch(DBUpdateNoRowsException e){}
			////
			db.prepareStatement(sql2);
			db.setLong(1,agentDayId);
			db.executeUpdate();
		}catch(DBUpdateNoRowsException e){ 

		}catch (DBException e) {
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
				throw new ShfException(actionErrors);
			}
		}	
	} 

	public void populateTabs(BreakSearchForm breakForm) throws ShfException {
		HashMap allTab = new HashMap();
		Vector futureBreakVec = new Vector();
		Vector currBreakVec = new Vector();
		Vector noExitBreakVec = new Vector();
		Vector noEntryBreakVec = new Vector();
		Vector endedOkBreakVec = new Vector();
		Vector endedNotOkBreakVec = new Vector();
		Vector breakVec = null;
		breakVec =  breakForm.getBreakVecCurrent();
		if (breakVec != null && breakVec.size() > 0) { 
				for (int i=0; i < breakVec.size(); i++) {
					BreakBean breakBean=(BreakBean)breakVec.get(i);
					
					String tempDateS = bzq.utils.BaseConvert.dateToString(new Date(),"dd/MM/yyyy")+" " +breakForm.getRefhreshed_time();
					Date refreshedDateTime;
					try {
						refreshedDateTime = bzq.utils.BaseConvert.stringToDate(tempDateS, "dd/MM/yyyy HH:mm");
					} catch (ConvertException e) {
						ActionErrors actionErrors = new ActionErrors();
						actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general", null));
						throw new ShfException(actionErrors);
					}
					checkForBreakException(breakBean);
					//עתיד לצאת להפסקה	
					if ((breakBean.getExitTime() == null) && 
						( breakBean.getStartTime().after(refreshedDateTime) || breakBean.getStartTime().equals(refreshedDateTime) )) {
						futureBreakVec.add(breakBean);
					}
					//נמצא בהפסקה
					if ((breakBean.getExitTime() != null) && 
						(breakBean.getEntryTime() == null) && 
						((breakBean.getEndTime().after(refreshedDateTime)) || (breakBean.getEndTime().equals(refreshedDateTime)) ) ) {
						currBreakVec.add(breakBean);
					}
					//לא חזר מהפסקה
					if ((breakBean.getExitTime() != null) && 
						(breakBean.getEntryTime() == null) && 
						(refreshedDateTime.after(breakBean.getEndTime())) ) {
						noEntryBreakVec.add(breakBean);
					}
					//לא יצא להפסקה
					if ((breakBean.getExitTime() == null) && 
						( refreshedDateTime.after(breakBean.getStartTime()) )) {
						noExitBreakVec.add(breakBean);
					}
					if (breakBean.getEntryTime() != null ) {
						if (breakBean.getBreakRemark() == "" ) {
							endedOkBreakVec.add(breakBean);
						} else {
							endedNotOkBreakVec.add(breakBean);
						}
					}
				}
				allTab.put(SHFConstants.BREAK_FUTURE, futureBreakVec);
				allTab.put(SHFConstants.BREAK_CURRENT, currBreakVec);
				allTab.put(SHFConstants.BREAK_NO_ENTRY, noEntryBreakVec);
				allTab.put(SHFConstants.BREAK_NO_EXIT, noExitBreakVec);
				allTab.put(SHFConstants.BREAK_ENDED_OK, endedOkBreakVec);
				allTab.put(SHFConstants.BREAK_ENDED_NOT_OK, endedNotOkBreakVec);
				
				breakForm.setAllTab(allTab);
		}
	}

	private void checkForBreakException(BreakBean breakBean) {
		
		String team = breakBean.getOrgUnitId();
		String moked=bzq.shf.utils.SHFTableUtils.getUnitByCode(team).getParent();
		int allowedLate = Integer.parseInt(bzq.shf.utils.SHFParameters.getMinimalBreakLate(moked).getValue());
		int allowedShifting = Integer.parseInt(bzq.shf.utils.SHFParameters.getMinimalBreakShifting(moked).getValue());
		String breakRemark="";
		long minuteLate = 0;
		if (breakBean.getExitTime() != null) {
			long diffExit = breakBean.getExitTime().getTime() - breakBean.getStartTime().getTime();
			if (Math.abs(diffExit/60000) > allowedShifting) {
				if (breakRemark != "" ) { breakRemark = breakRemark + ",";}  
				breakRemark = breakRemark + " יציאה ";
			}
			if ( (breakBean.getEntryTime() != null) ) 	{
				long diffEntry = breakBean.getEntryTime().getTime() - breakBean.getEndTime().getTime();
				if (Math.abs(diffEntry/60000) > allowedShifting) {
					if (breakRemark != "" ) { breakRemark = breakRemark + ",";}
					breakRemark = breakRemark + " חזרה ";
				}
				long planedLen = breakBean.getEndTime().getTime() - breakBean.getStartTime().getTime();
				long actualLen = breakBean.getEntryTime().getTime() - breakBean.getExitTime().getTime();
				if(   ( ( ( actualLen ) - ( planedLen ))/60000 ) > allowedLate )
						{ 	minuteLate = (actualLen-planedLen)/60000 - allowedLate;
						if (breakRemark != "" ) { breakRemark = breakRemark + ",";}
						breakRemark = breakRemark + " משך ";
						} // time in milisec
					else
						{	minuteLate = 0; }
				}
		}
		
		breakBean.setBreakRemark((breakRemark==null)?"":breakRemark);
		breakBean.setMinuteLate(minuteLate);
	}
	
	
	public static void addBreak(DBAccess db , BreakBean breakBean) throws DBException{
		int param=1;
		StringBuffer sql=new StringBuffer();
		sql.append("INSERT INTO SHIFTER.SHF_EMPLOYEE_EXCEPTIONS t( ");
		sql.append("t.AGENT_DAY_ID,");
		sql.append("t.DURATION,");
		sql.append("t.START_TIME,");
		sql.append("t.END_TIME,");
		sql.append("t.SOURCE,");
		sql.append("t.STATE_TYPE,");
		sql.append("t.EXCEPTION_TYPE,");
		sql.append("t.MODIFICATION_USER,");
		sql.append("t.MODIFICATION_TIME) ");
		sql.append("values(?,?,?,?,?,?,?,?,?)");
		
		db.prepareStatement(sql.toString());
		db.setLong(param++, breakBean.getAgentDayId());
		db.setInt(param++,breakBean.getDuration());
		db.setTimestamp(param++, breakBean.getStartTime());
		db.setTimestamp(param++,breakBean.getEndTime());
		db.setString(param++, breakBean.getSource());
		db.setInt(param++,breakBean.getStateType());
		db.setString(param++, breakBean.getExceptionType());
		db.setString(param++,breakBean.getModificationUser());
		db.setTimestamp(param++, breakBean.getModificationTime());
		
		db.executeUpdate();
		
	}

	public ServletContext getsCtx() {
		return sCtx;
	}

	public void setsCtx(ServletContext sCtx) {
		this.sCtx = sCtx;
	}

}
