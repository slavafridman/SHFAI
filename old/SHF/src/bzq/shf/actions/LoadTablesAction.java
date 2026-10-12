/*
 * Created on 23/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.struts.action.Action;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import bzq.shf.model.LoadTables;
import bzq.utils.TablesContainer;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class LoadTablesAction extends Action{
	
	private Logger logger = Logger.getLogger(LoadTablesAction.class);
	
	/* (non-Javadoc)
	 * @see bzq.shf.actions.BaseAction#performAction(org.apache.struts.action.ActionMapping, org.apache.struts.action.ActionForm, javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	public ActionForward perform(
	ActionMapping mapping,
	ActionForm form,
	HttpServletRequest request,
	HttpServletResponse response)
	throws java.io.IOException, javax.servlet.ServletException {
		logger.info("Beginning LoadTables Action");
			
		TablesContainer tablesContainer = 
		(TablesContainer) request.getSession().getServletContext().getAttribute(bzq.utils.AppConstants.TABLES_KEY);
		
		LoadTables loader=new LoadTables(tablesContainer);
		
		
		try {
			if(request.getParameter("tableName")!=null){
				String tname=(String)request.getParameter("tableName");
				loader.load(tname);
			}else{
				loader.loadJobs();	
				logger.info("jobs loaded");
				loader.loadOrgUnit();	
				logger.info("loadOrgUnit loaded");
				loader.loadSiteUnitTable();
				logger.info("loadSiteUnitTable loaded");
				loader.loadActivities();
				logger.info("loadActivities loaded");
				loader.loadEventReasons();
				logger.info("loadEventReasons loaded");
				loader.loadSkills();
				logger.info("loadSkills loaded");
				loader.loadParameters();
				logger.info("loadParameters loaded");
				loader.loadExceptions();
				logger.info("loadExceptions loaded");
				loader.loadVirtualActivities();
				logger.info("loadVirtualActivities loaded");
				loader.loadCompletions();
				logger.info("completions loaded");
				loader.loadInnerJobs();
				logger.info("innerJobs loaded");
				loader.loadTimeoffTypes();
				logger.info("timeoffTypes loaded");
				loader.loadMobileAuditRef();
				logger.info("mobileAuditRef loaded");
			}
		}
		catch(Exception e){
			//response.getWriter().write("Error: "+e.getMessage());
		}
		response.getWriter().write("Tables Loaded Successfuly");
		return null;
		
	}
	

}
