/*

 * Created on 29/12/2008

 *

 * To change the template for this generated file go to

 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments

 */

package bzq.shf.actions;



import java.io.IOException;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.db.DBException;
import bzq.shf.dao.EventReasonDao;
import bzq.shf.dao.FactoryAdminDao;
import bzq.shf.dao.SkillDao;
import bzq.shf.model.LoadTables;
import bzq.shf.transfer.EventReason;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SharingUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;



/**

 * @author 04982497

 *

 * To change the template for this generated type comment go to

 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments

 */

public class AdminAction extends BaseAction{
	

	public ActionForward performAction(ActionMapping mapping, ActionForm form, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException{

		ActionForward result=null;

		//String param=(String)parameters.get("param");
		//String param2=(String)parameters.get("act");
		String action = null;
		EventReason eventReason = null;
		String type = "1";
		String reported = "0";
		String reportRequested = "0";
		
		if (form!=null)	{		
			eventReason = (EventReason)form;
			action = eventReason.getAction();
			type = String.valueOf(eventReason.getType());
			reported = String.valueOf(eventReason.getReported());	
			reportRequested = String.valueOf(eventReason.getReportRequested());				
			
		}	
		if(action==null){
			result=mapping.findForward("mainAdmin");
		}
		else if("showEventReason".equals(action)){									
			Vector eventReasonVec = null;	    
			EventReasonDao eventReasonDao = (EventReasonDao)FactoryAdminDao.getDaoFactory(FactoryAdminDao.EVENT_REASON);	        
			try {
				eventReasonVec = eventReasonDao.select(type);
			} catch (ShfException e) {
				e.printStackTrace();
			}	    
 		  	request.setAttribute("eventReason",eventReasonVec);	
 		  	request.setAttribute("eventReasonForm",eventReason);	
			result=mapping.findForward("showEventReason"); 		  	
		}else if("showEventType".equals(action)){									
			Vector eventReasonVec = null;	    
			EventReasonDao eventReasonDao = (EventReasonDao)FactoryAdminDao.getDaoFactory(FactoryAdminDao.EVENT_REASON);	        
			try {
				eventReasonVec = eventReasonDao.select(type);
			} catch (ShfException e) {
				e.printStackTrace();
			}	    
			request.setAttribute("eventReason",eventReasonVec);
	 		result=mapping.findForward("showEventType"); 	
	 		request.setAttribute("eventReasonForm",eventReason);
	 		
		} else if("updatedeleteEventReason".equals(action)){
			eventReason.setBranch(request.getParameter("branch"));
			eventReason.setReasonId(Integer.parseInt(request.getParameter("reasonId")));
			eventReason.setReasonName(request.getParameter("reasonName"));
			eventReason.setReported(Integer.parseInt(reported));
			eventReason.setReportRequested(Integer.parseInt(reportRequested));
			eventReason.setType(Integer.parseInt(type));							
			request.setAttribute("result",eventReason);
			result=mapping.findForward("updatedeleteEventReason"); 	
			
			request.setAttribute("eventReasonForm",eventReason);
			
		} else if("updatedeleteEventType".equals(action)){
			eventReason.setBranch(request.getParameter("branch"));
			eventReason.setReasonId(Integer.parseInt(request.getParameter("reasonId")));
			eventReason.setReasonName(request.getParameter("reasonName"));
			eventReason.setReported(Integer.parseInt(reported));
			eventReason.setReportRequested(Integer.parseInt(reportRequested));
			eventReason.setType(Integer.parseInt(type));							
			request.setAttribute("result",eventReason);
			result=mapping.findForward("updatedeleteEventType");
			
			request.setAttribute("eventReasonForm",eventReason);
		} else if("updateActivityAim".equals(action)){
			result=mapping.findForward("updateActivityAim");
			
		} else if("updateSkills".equals(action)){
			Vector skills = null;	    
			SkillDao skillDao = (SkillDao)FactoryAdminDao.getDaoFactory(FactoryAdminDao.SKILL_TABLE);	        
			try {
				skills = skillDao.select(type);
			} catch (ShfException e) {
				e.printStackTrace();
			}	    
			request.setAttribute("skills",skills);
			result=mapping.findForward("updateSkills");
		} 
		
		
		
		else if("updateEventReason".equals(action) || "updateEventType".equals(action)){													    
			EventReasonDao eventReasonDao = (EventReasonDao)FactoryAdminDao.getDaoFactory(FactoryAdminDao.EVENT_REASON);	        
			try {			
				if (eventReasonDao.update(eventReason))	{
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.updateSecceeded", null));
					saveErrors(request,actionErrors);
					TablesContainer tablesContainer =(TablesContainer) request.getSession().getServletContext().getAttribute(bzq.utils.AppConstants.TABLES_KEY);
					//LoadTables loader=new LoadTables(tablesContainer);
					//try {
					//	loader.loadEventReasons();
						SharingUtils.reloadTables(TablesConstants.EVENT_REASON_TABLE);
					//} catch (DBException e1) {}
				}
	
			} catch (ShfException e) {
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.updateFailed", null));
				saveErrors(request,actionErrors);
			}
			eventReason.setBranch(request.getParameter("branch"));
			eventReason.setReasonId(Integer.parseInt(request.getParameter("reasonId")));
			eventReason.setReasonName(request.getParameter("reasonName"));
			eventReason.setReported(Integer.parseInt(reported));
			eventReason.setReportRequested(Integer.parseInt(reportRequested));
			eventReason.setType(Integer.parseInt(type));							
			request.setAttribute("result",eventReason);
			if("updateEventReason".equals(action))		
				result=mapping.findForward("updatedeleteEventReason");
			else result=mapping.findForward("updatedeleteEventType");	   
			
			request.setAttribute("eventReasonForm",eventReason);
		}
		
		if("deleteEventReason".equals(action) || "deleteEventType".equals(action)){													    
			EventReasonDao eventReasonDao = (EventReasonDao)FactoryAdminDao.getDaoFactory(FactoryAdminDao.EVENT_REASON);				        
			try {			
				if (eventReasonDao.delete(eventReason.getReasonId()))	{
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.deleteSecceeded", null));
					saveErrors(request,actionErrors);
					TablesContainer tablesContainer =(TablesContainer) request.getSession().getServletContext().getAttribute(bzq.utils.AppConstants.TABLES_KEY);
					SharingUtils.reloadTables(TablesConstants.EVENT_REASON_TABLE);
					/*LoadTables loader=new LoadTables(tablesContainer);
					try {
						loader.loadEventReasons();
					} catch (DBException e1) {}*/
				}
		
			} catch (ShfException e) {
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.deleteFailed", null));
				saveErrors(request,actionErrors);
			}
			Vector eventReasonVec = null;	    	        
			try {
				eventReasonVec = eventReasonDao.select(type);
			} catch (ShfException e) {
				e.printStackTrace();
			}	    
			request.setAttribute("eventReason",eventReasonVec);
			if("deleteEventReason".equals(action)) 		  						
				result=mapping.findForward("showEventReason");
			else result=mapping.findForward("showEventType");	   
			
			request.setAttribute("eventReasonForm",eventReason);
		}
		
		
		if("insertEventReason".equals(action) || "insertEventType".equals(action)){													    
			EventReasonDao eventReasonDao = (EventReasonDao)FactoryAdminDao.getDaoFactory(FactoryAdminDao.EVENT_REASON);
			try {			
				if (eventReasonDao.insert(eventReason))	{
					ActionErrors actionErrors=new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.insertSecceeded", null));
					saveErrors(request,actionErrors);
					TablesContainer tablesContainer =(TablesContainer) request.getSession().getServletContext().getAttribute(bzq.utils.AppConstants.TABLES_KEY);
					LoadTables loader=new LoadTables(tablesContainer);
					try {
						loader.loadEventReasons();
					} catch (DBException e1) {}
				}
		
			} catch (ShfException e) {
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.insertFailed", null));
				saveErrors(request,actionErrors);
			}
			Vector eventReasonVec = null;	    	        
			try {
				eventReasonVec = eventReasonDao.select(type);
			} catch (ShfException e) {
				e.printStackTrace();
			}	    
			request.setAttribute("eventReason",eventReasonVec);
			if("insertEventReason".equals(action)) 		  										    			
			result=mapping.findForward("showEventReason");	
			else result=mapping.findForward("showEventType");	
			
			request.setAttribute("eventReasonForm",eventReason);
		}				

		else if("viewCompletionsTypes".equals(action)){
			AppResources appRes=AppResources.getInstance();
			TablesContainer tc = appRes.getTablesContainer();
			Vector completions = tc.getTable("completionCode");
			request.setAttribute("completions",completions);
			result=mapping.findForward("viewCompletionsTypes");
		}
		
		
		return result;

	}



}

