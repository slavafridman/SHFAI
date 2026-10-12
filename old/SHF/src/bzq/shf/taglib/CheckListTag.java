/*
 * Created on 21/06/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import java.util.Vector;

import javax.servlet.jsp.JspException;

import org.apache.poi.ss.formula.functions.Irr;
import org.apache.struts.util.RequestUtils;
import org.apache.struts.util.ResponseUtils;

import bzq.shf.forms.TableForm;
import bzq.taglib.BaseHandlerTag;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CheckListTag extends BaseHandlerTag {
	
	protected String property;
	protected String name;
	protected String tablename;
	protected int optionsLength=170;
	protected int length=140;
	protected boolean disabled= false;
	
	Vector<TableForm> irrelevantModules = null;	// modules not suited for selected filters
	
	
	public int getLength() {
		return length;
	}

	public void setLength(int length) {
		this.length = length;
	}

	public int getOptionsLength() {
		return optionsLength;
	}

	public void setOptionsLength(int optionsLength) {
		this.optionsLength = optionsLength;
	}
	
	public boolean isDisabled() {
		return disabled;
	}

	public void setDisabled(boolean disabled) {
		this.disabled = disabled;
	}

	public int doStartTag() throws JspException {
		
		Vector<TableForm> vector=getList();
		String[] array = null;
		
		
		
			try{
				array = (String[])RequestUtils.lookup(pageContext, name, property,"request" );
			}catch (Exception e) {
				System.out.println(e.getMessage());
			}
		
		
		String textValue="";
		String str="";
		
		if(array==null || array.length==0 || array[0].equals("00")){
			str="checked=\"checked\"";
			textValue="הכל";
		}
		else{
			textValue="לחץ להצגת ערכים";
		}
		
		StringBuffer results = new StringBuffer();
		results.append("<SCRIPT>function showhide"+property+"list(){");
		results.append("if(document.getElementById('"+property+"Id').style.display=='none'){");
		results.append("document.getElementById('"+property+"Id').style.display='';");
		results.append("}else{");
		results.append("document.getElementById('"+property+"Id').style.display='none';");
		results.append("}} ");
		results.append("function allChecked(e,element_name){if(e.checked){document.getElementById('text'+element_name).value='הכל';elements = document.getElementsByName(element_name);for(i=0;i<elements.length;i++){if(elements[i]!=e) elements[i].checked=false;}}}</SCRIPT>");
		
		results.append("<div style=\"width:"+(length)+"px;\"><input type=\"text\" " );
		if(!disabled){
			results.append("onclick=\"showhide"+property+"list();\" " );
		}	
		results.append("readonly=\"readonly\" style=\"font-size:11px;width:"+(length-18)+"px;\" id=\"text"+property+"\" value=\""+textValue+"\">");
		//results.append("<input type=\"text\" onclick=\"showhide"+property+"list();\" readonly=\"readonly\" style=\"font-size:11px;width:20px;\" >");
		results.append("<img src=\"/shf/images/listopen.png\" ");
		if(!disabled){
			results.append("onclick=\"showhide"+property+"list();\" ");
		}
		results.append(" style=\"padding-top:3px;position:absolute;\"/></div>");
		results.append("<div style=\"position:absolute;overflow:auto;height:403px;\">");
		results.append("<div style=\"display:none;margin-left:120px;width:"+ (optionsLength+17) +"px;padding:0px;height:400px;\" id="+property+"Id>");
		results.append("<table width="+optionsLength+"px style=\"font-size:13px;border:1px black solid;background-color:#ffffff;position:absolute;margin-top:0px;\" cellspacing=0 cellpadding=0>");
		
		
		results.append("<tr><td align=right width=10px valign=top  style=\"border-bottom:2px black solid;\">");
		results.append("<input type=\"checkbox\" value=\"00\" id=\"all"+property+"\" name=\""+property+"\" "+str+" onclick=\"allChecked(this,'"+property+"');\">");
		results.append("</td><td style=\"border-bottom:2px black solid;\">הכל</td></tr>");
		
		TableForm item=null;
		String checkedStr="";
		if(!disabled){
		for(int i=0;i<vector.size();i++){
			checkedStr="";
			item=vector.get(i);
			if(contains(array,item.getCode())){
				checkedStr="checked=\"checked\"";
			}
			
			String disabled = "";
			if (irrelevantModules != null && irrelevantModules.size() > 0) {
				for (TableForm irrModule : irrelevantModules) {
					if (irrModule.getCode().equals(item.getCode())) {
						disabled = " disabled ";
					}
				}
			}
			
			results.append("<tr><td align=right width=10px valign=top>");
			
			results.append("<input type=\"checkbox\" value=\""+item.getCode()+"\" name=\""+property+"\" "+checkedStr+" "+disabled+" onclick=\"document.getElementById('all"+property+"').checked=false;document.getElementById('text"+property+"').value='לחץ להצגת ערכים';\">");
			
			results.append("</td>");
			results.append("<td>"+item.getDescription()+"</td>");
			results.append("</tr>");
		}}
		
		results.append("</table></div></div>");
		ResponseUtils.write(pageContext, results.toString());
		return (SKIP_BODY);	
	}
	
	private boolean contains(String[] array,String item){
		if(array==null || array.length==0) return false;
		for(int i=0;i<array.length;i++){
			if(array[i].equals(item)){
				return true;
			}
		}
		return false;
	}
	
	
	
	

	public Vector getList(){
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
	    Vector table = tablesContainer.getTable(tablename);
		return table;
	}
	
	public String getProperty() {
		return property;
	}

	public void setProperty(String property) {
		this.property = property;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getTablename() {
		return tablename;
	}

	public void setTablename(String tableName) {
		this.tablename = tableName;
	}
	
	
	

}
